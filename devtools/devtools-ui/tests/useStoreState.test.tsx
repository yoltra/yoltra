// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { DevtoolsRole, type DevtoolsMessage } from "@yoltra/devtools-protocol";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { HubContext } from "../src/context/HubContext";
import { useStoreState } from "../src/hooks/useStoreState";
import type { HubContextValue } from "../src/types";

/**
 * The State view's baseline.
 *
 * An agent starts at version 0 and counts committed events from there, so a store that has
 * committed nothing when the panel opens answers with a version 0 snapshot. That is the usual
 * order: open the panel, then use the app. The hook read version 0 as "no snapshot yet", so it
 * buffered every later patch and the view stayed on the initial state.
 */

/** A hub context that records what the hook sends and lets the test deliver frames. */
function fakeHub() {
  const handlers = new Set<(msg: DevtoolsMessage) => void>();
  const sent: DevtoolsMessage[] = [];
  const value: HubContextValue = {
    status: "connected",
    extensionId: "panel-1",
    send: (msg) => void sent.push(msg),
    subscribe: (handler) => {
      handlers.add(handler);
      return () => void handlers.delete(handler);
    },
    disconnect: () => undefined,
    reconnect: () => undefined,
  };
  const deliver = (msg: Record<string, unknown>) =>
    act(() => {
      for (const h of [...handlers]) h(msg as unknown as DevtoolsMessage);
    });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <HubContext.Provider value={value}>{children}</HubContext.Provider>
  );
  return { sent, deliver, wrapper };
}

const meta = {
  timestamp: "2026-01-01T00:00:00.000Z",
  sourceId: "s",
  sourceRole: DevtoolsRole.STORE,
};

const snapshot = (storeId: string, state: unknown, version: number) => ({
  type: "STATE_SNAPSHOT",
  ...meta,
  storeId,
  state,
  version,
  reducerNames: Object.keys(state as object),
});

const committed = (storeId: string, value: number, snapshotVersion: number) => ({
  type: "STORE_EVENT",
  ...meta,
  storeId,
  event: { id: `e${snapshotVersion}`, channel: "c", type: "inc", payload: 1 },
  patches: [{ op: "replace", path: "/c/n", value }],
  snapshotVersion,
  committed: true,
});

describe("useStoreState after a version 0 snapshot", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("applies the patches that follow it", async () => {
    const hub = fakeHub();
    const { result } = renderHook(() => useStoreState("s1"), { wrapper: hub.wrapper });

    await hub.deliver(snapshot("s1", { c: { n: 0 } }, 0));
    expect(result.current.state).toEqual({ c: { n: 0 } });
    expect(result.current.loading).toBe(false);

    await hub.deliver(committed("s1", 1, 1));
    expect(result.current.state).toEqual({ c: { n: 1 } });
    expect(result.current.version).toBe(1);

    await hub.deliver(committed("s1", 2, 2));
    expect(result.current.state).toEqual({ c: { n: 2 } });
    expect(result.current.version).toBe(2);
  });

  it("stops asking for a snapshot once it has one", async () => {
    const hub = fakeHub();
    renderHook(() => useStoreState("s1"), { wrapper: hub.wrapper });
    const requests = () => hub.sent.filter((m) => m.type === "REQUEST_STATE").length;
    expect(requests()).toBe(1);

    await hub.deliver(snapshot("s1", { c: { n: 0 } }, 0));
    await act(() => vi.advanceTimersByTimeAsync(6000));

    expect(requests()).toBe(1);
  });

  it("still ignores a patch it has already seen", async () => {
    const hub = fakeHub();
    const { result } = renderHook(() => useStoreState("s1"), { wrapper: hub.wrapper });

    await hub.deliver(snapshot("s1", { c: { n: 3 } }, 3));
    await hub.deliver(committed("s1", 99, 3));

    expect(result.current.state).toEqual({ c: { n: 3 } });
  });

  it("starts over for a different store", async () => {
    const hub = fakeHub();
    const { result, rerender } = renderHook(({ id }) => useStoreState(id), {
      wrapper: hub.wrapper,
      initialProps: { id: "s1" },
    });
    await hub.deliver(snapshot("s1", { c: { n: 0 } }, 0));

    rerender({ id: "s2" });
    // Before the new store's snapshot, its patches wait; applying them to the previous store's
    // state would show a mixture of the two.
    await hub.deliver(committed("s2", 7, 1));
    expect(result.current.state).toEqual({ c: { n: 0 } });

    await hub.deliver(snapshot("s2", { c: { n: 5 } }, 0));
    expect(result.current.state).toEqual({ c: { n: 7 } });
    expect(result.current.version).toBe(1);
  });
});
