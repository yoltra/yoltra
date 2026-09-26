/**
 * `useEvent` against a real store during a devtools time-travel.
 *
 * @remarks
 * This is the only test in the package that would catch a regression in core's replay
 * notification rule, and it exists because the mock cannot cover it. `createMockStore` is a
 * structural cast that reimplements phase matching locally, so it will neither fail to
 * compile when `StoreInstance` grows nor reflect what core actually does - **the mock is the
 * thing being bypassed.** The 366 lines of mock-based `useEvent` tests would all stay green
 * while core silently went back to notifying every subscriber on every scrub.
 *
 * What replay used to do, with no way to detect it from inside a handler: run every
 * `onEvent` handler exactly as a live event would, so dragging a devtools timeline
 * re-published to peers, re-wrote to sockets and re-fired analytics for events that did not
 * happen again.
 */

import { render, act } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";

import { createYoltra } from "../../src/createYoltra";

type CounterState = { value: number };

function makeApp() {
  return createYoltra({
    name: "ReplayApp",
    reducer: {
      counter: {
        state: { value: 0 } as CounterState,
        when: { keys: [["math", "add"]] },
        reducer: (s: CounterState, e): CounterState =>
          e.type === "add" ? { value: s.value + (e.payload as number) } : s,
      },
    },
    devtools: { allowReplay: true },
  });
}

describe("useEvent during replay, against a real store", () => {
  it("does not run a default handler while replaying", () => {
    const app = makeApp();
    const handler = vi.fn();

    function Probe() {
      app.useEvent("math", "add", handler);
      return null;
    }
    render(<Probe />);

    act(() => {
      app.store.__replayEvents({ counter: { value: 0 } }, [
        { channel: "math", type: "add", payload: 5, id: "r1" },
      ]);
    });

    expect(handler).not.toHaveBeenCalled();
    // State still moved: replay reduces, it just does not re-notify.
    expect(app.store.getState().counter.value).toBe(5);
  });

  it("runs a handler that opted in with duringReplay", () => {
    const app = makeApp();
    const optedIn = vi.fn();
    const defaulted = vi.fn();

    function Probe() {
      app.useEvent("math", "add", optedIn, "committed", { duringReplay: true });
      app.useEvent("math", "add", defaulted, "committed");
      return null;
    }
    render(<Probe />);

    act(() => {
      app.store.__replayEvents({ counter: { value: 0 } }, [
        { channel: "math", type: "add", payload: 5, id: "r1" },
      ]);
    });

    expect(optedIn).toHaveBeenCalledTimes(1);
    expect(defaulted).not.toHaveBeenCalled();
  });

  it("still runs both handlers for a live emit", async () => {
    // The guard is scoped to replay. Leaking into the live path would silence every handler
    // in the application, which is a far worse failure than the one being fixed.
    const app = makeApp();
    const optedIn = vi.fn();
    const defaulted = vi.fn();

    function Probe() {
      app.useEvent("math", "add", optedIn, "committed", { duringReplay: true });
      app.useEvent("math", "add", defaulted, "committed");
      return null;
    }
    render(<Probe />);

    await act(async () => {
      await app.store.emit("math", "add", 3);
    });

    expect(optedIn).toHaveBeenCalledTimes(1);
    expect(defaulted).toHaveBeenCalledTimes(1);
  });

  it("does not resubscribe on every render", () => {
    // The dep array takes `options?.duringReplay`, not `options`. An object literal is a new
    // reference each render, so depending on it would unsubscribe and resubscribe every
    // time - a loop that leaves the subscription looking correct at every observed point,
    // which is why it needs its own assertion rather than trusting the others to notice.
    const app = makeApp();
    const onEventSpy = vi.spyOn(app.store, "onEvent");

    function Probe({ tick }: { tick: number }) {
      app.useEvent("math", "add", () => {}, "committed", { duringReplay: true });
      return <span>{tick}</span>;
    }

    const { rerender } = render(<Probe tick={0} />);
    const afterFirst = onEventSpy.mock.calls.length;

    rerender(<Probe tick={1} />);
    rerender(<Probe tick={2} />);

    expect(onEventSpy.mock.calls.length).toBe(afterFirst);
    onEventSpy.mockRestore();
  });

  it("exposes isReplaying on the real store", () => {
    const app = makeApp();
    const seen: boolean[] = [];

    function Probe() {
      app.useEvent(
        "math",
        "add",
        () => {
          seen.push(app.store.isReplaying);
        },
        "committed",
        { duringReplay: true },
      );
      return null;
    }
    render(<Probe />);

    act(() => {
      app.store.__replayEvents({ counter: { value: 0 } }, [
        { channel: "math", type: "add", payload: 5, id: "r1" },
      ]);
    });

    expect(seen).toEqual([true]);
    expect(app.store.isReplaying).toBe(false);
  });
});
