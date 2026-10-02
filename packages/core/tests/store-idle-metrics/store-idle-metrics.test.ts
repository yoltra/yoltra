import { describe, expect, it } from "vitest";

import { createStore } from "../../src/index";
import type { ReducerSpec } from "../../src/index";

/**
 * `store.metrics()` and `store.whenIdle()`: the store's load, and a way to wait for it to finish.
 *
 * A process shutting down gracefully stops taking work, waits for what is in progress and then
 * disposes. Waiting needed a poll over `__devtoolsIntrospect()`, which rebuilds the whole
 * registration inventory on every call.
 */

type EM = { job: { start: number; step: number; done: null }; rpc: { ask: null; answer: null } };

const log: ReducerSpec<{ n: number }, EM> = {
  state: { n: 0 },
  when: { keys: [["job", "start"], ["job", "step"]] },
  reducer: (s) => ({ n: s.n + 1 }),
};

const build = (dedupWindowMs = 0) =>
  createStore<{ log: { n: number } }, EM>({ name: "Idle", reducer: { log }, dedupWindowMs });

function gate() {
  let open!: () => void;
  const opened = new Promise<void>((resolve) => (open = resolve));
  return { opened, open };
}

describe("store.metrics", () => {
  it("reports an idle store as zeros", () => {
    expect(build().metrics()).toEqual({ queueDepth: 0, inFlightEffects: 0, dedupHits: 0, dedupEntries: 0 });
  });

  it("counts effects in flight while they run", async () => {
    const store = build();
    const release = gate();
    store.registerEffect({ when: { keys: [["job", "start"]] }, effect: () => release.opened });

    const done = store.emit("job", "start", 1);
    await Promise.resolve();
    expect(store.metrics().inFlightEffects).toBe(1);

    release.open();
    await done;
    expect(store.metrics().inFlightEffects).toBe(0);
  });

  it("counts duplicates and the fingerprints held for them", async () => {
    const store = build(1_000);
    await store.emit("job", "step", 1);
    await store.emit("job", "step", 1);
    await store.emit("job", "step", 2);
    expect(store.metrics()).toMatchObject({ dedupHits: 1, dedupEntries: 2 });
    store.dispose();
  });
});

describe("store.whenIdle", () => {
  it("resolves at once when nothing is in progress", async () => {
    await expect(build().whenIdle()).resolves.toBeUndefined();
  });

  it("waits for running effects, and for the work they cause", async () => {
    const store = build();
    const release = gate();
    const order: string[] = [];
    store.registerEffect({
      when: { keys: [["job", "start"]] },
      effect: async (_e, _g, emit) => {
        await release.opened;
        await emit("job", "step", 1);
        order.push("start effect done");
      },
    });
    store.registerEffect({
      when: { keys: [["job", "step"]] },
      effect: async () => {
        await Promise.resolve();
        order.push("step effect done");
      },
    });

    void store.emit("job", "start", 1);
    const idle = store.whenIdle().then(() => order.push("idle"));
    await Promise.resolve();
    expect(order).toEqual([]);

    release.open();
    await idle;
    expect(order).toEqual(["step effect done", "start effect done", "idle"]);
  });

  it("is not held up by a call waiting for its reply", async () => {
    const store = build();
    const call = store.call("rpc", "ask", null, { reply: ["rpc", "answer"], timeoutMs: 60_000 });
    await store.whenIdle();
    call.cancel();
    await call.catch(() => undefined);
  });

  it("releases every waiter when the store is disposed mid-work", async () => {
    const store = build();
    store.registerEffect({ when: { keys: [["job", "start"]] }, effect: () => new Promise<void>(() => undefined) });
    void store.emit("job", "start", 1);

    const waits = [store.whenIdle(), store.whenIdle()];
    store.dispose();

    await expect(Promise.all(waits)).resolves.toEqual([undefined, undefined]);
    await expect(store.whenIdle()).resolves.toBeUndefined();
  });
});
