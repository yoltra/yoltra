import { afterEach, describe, expect, it } from "vitest";

import { createStore, type ReducerSpec } from "@yoltra/core";
import { DevtoolsRole, PROTOCOL_VERSION } from "@yoltra/devtools-protocol";
import { createLoopbackHub } from "@yoltra/devtools-ui";

import { withDevtools } from "../src/withDevtools";

/**
 * Proves the exact data flow of the embeddable demo: the *real* browser agent
 * wired to an in-memory loopback hub, with a mock panel on the other side.
 * No WebSocket server, no ports, no extension — everything in one process.
 */

const tick = () => new Promise((r) => setTimeout(r, 0));

async function waitFor<T>(
  fn: () => T | undefined | false,
  { timeout = 2000, interval = 10, label = "condition" } = {},
): Promise<T> {
  const start = Date.now();
  for (;;) {
    const v = fn();
    if (v !== undefined && v !== false) return v as T;
    if (Date.now() - start > timeout) throw new Error(`waitFor timed out: ${label}`);
    await new Promise((r) => setTimeout(r, interval));
  }
}

type EM = { ui: { increment: number } };
type AnyMsg = Record<string, any>;

const counterSpec: ReducerSpec<{ value: number }, EM> = {
  state: { value: 0 },
  events: [["ui", "increment"]],
  reducer: (s, e) => (e.type === "increment" ? { value: s.value + (e.payload as number) } : s),
};

describe("browser agent over the loopback transport (embedded demo flow)", () => {
  const cleanups: Array<() => void> = [];
  afterEach(() => {
    for (const c of cleanups.splice(0).reverse()) {
      try {
        c();
      } catch {
        /* best-effort */
      }
    }
  });

  it("streams a patch to an embedded panel and applies time-travel back — no sockets", async () => {
    const hub = createLoopbackHub();

    // Real store + real browser agent, but over the injected loopback transport.
    const store = createStore({
      name: "loopback-counter",
      reducer: { counter: counterSpec },
      devtools: { allowReplay: true },
    });
    withDevtools(store, {
      port: 0,
      storeId: "s1",
      allowReplay: true,
      socketFactory: hub.agentSocketFactory,
    });
    cleanups.push(() => store.dispose());

    // Mock panel connected via the loopback WebSocket class.
    const panel = new hub.WebSocket("ws://loopback");
    const msgs: AnyMsg[] = [];
    panel.onmessage = (ev) => msgs.push(JSON.parse(ev.data as string));
    cleanups.push(() => panel.close());
    await tick();
    panel.send(
      JSON.stringify({
        type: "HANDSHAKE_REQUEST",
        protocolVersion: PROTOCOL_VERSION,
        role: DevtoolsRole.EXTENSION,
        extension: { id: "panel-1", name: "Embedded Panel", capabilities: {} },
      }),
    );

    await waitFor(
      () =>
        msgs.some(
          (m) =>
            (m.type === "STORE_CONNECTED" && m.store?.id === "s1") ||
            (m.type === "STORE_REGISTRY" && m.stores?.some((s: AnyMsg) => s.id === "s1")),
        ),
      { label: "store visible to panel" },
    );

    // Emit -> the real agent streams a STORE_EVENT with a replace patch.
    const before = msgs.length;
    await store.emit("ui", "increment", 5);

    const storeEvent = await waitFor(
      () => msgs.slice(before).find((m) => m.type === "STORE_EVENT" && m.committed),
      { label: "STORE_EVENT at panel" },
    );
    expect(storeEvent.patches).toContainEqual({ op: "replace", path: "/counter/value", value: 5 });

    // Panel -> TIME_TRAVEL -> loopback hub -> real agent applies it to the store.
    panel.send(
      JSON.stringify({
        type: "TIME_TRAVEL",
        storeId: "s1",
        state: { counter: { value: 999 } },
        snapshotVersion: (storeEvent.snapshotVersion ?? 0) + 1,
        timestamp: new Date().toISOString(),
        sourceId: "panel-1",
        sourceRole: DevtoolsRole.EXTENSION,
      }),
    );

    await waitFor(() => store.getState().counter.value === 999, {
      label: "time-travel applied to store",
    });
    expect(store.getState().counter.value).toBe(999);
  });
});
