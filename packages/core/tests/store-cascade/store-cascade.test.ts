import { describe, it, expect, vi, afterEach } from "vitest";

import { createStore } from "../../src/store/Store";
import type { CascadeInfo } from "../../src/types";

/**
 * The reduce queue drains synchronously, so a cascade is not a slow program — it is a frozen
 * tab or a pinned core, with no error and no stack to point at. Every test here is really the
 * same assertion: **the process gets to the end of the test.** If the guard regresses, these do
 * not fail, they hang, which is why each one is written to terminate on its own.
 */

type EM = {
  ping: { go: number };
  pong: { go: number };
  data: { upsert: number };
};

type State = { n: number };

afterEach(() => {
  vi.restoreAllMocks();
});

/** Silences the console.error the guard emits, and hands back the spy to assert on. */
function quiet() {
  return vi.spyOn(console, "error").mockImplementation(() => undefined);
}

describe("an unconfigured store still terminates", () => {
  it("bounds two reducers wired into each other", async () => {
    quiet();
    const cascades: CascadeInfo<EM>[] = [];

    // The shape a consumer actually creates by accident: each slice answers the other's event.
    const store = createStore<{ a: State; b: State }, EM>({
      name: "mutual",
      reducer: {
        a: {
          state: { n: 0 },
          when: { keys: [["ping", "go"]] },
          reducer: (s) => ({ n: s.n + 1 }),
        },
        b: {
          state: { n: 0 },
          when: { keys: [["pong", "go"]] },
          reducer: (s) => ({ n: s.n + 1 }),
        },
      },
      onCascade: (info) => cascades.push(info),
    });

    // Subscribers, not effects: these run inside the drain, so the loop feeds itself without
    // ever yielding. This is the shape that hangs a thread rather than merely never finishing.
    store.onEvent("ping", "go", (_e, _get, emit) => {
      void emit("pong", "go", 1);
    });
    store.onEvent("pong", "go", (_e, _get, emit) => {
      void emit("ping", "go", 1);
    });

    await store.emit("ping", "go", 1);

    // Terminating at all is the assertion. The rest describes how it terminated.
    expect(cascades).toHaveLength(1);
    expect(cascades[0]!.limit).toBe("maxReduceDepth");
    expect(cascades[0]!.limitValue).toBe(64);
    expect(cascades[0]!.depth).toBe(65);
  });

  it("bounds a cascade that crosses drains through an effect", async () => {
    quiet();
    const cascades: CascadeInfo<EM>[] = [];

    const store = createStore<{ a: State }, EM>({
      name: "effect-loop",
      reducer: {
        a: { state: { n: 0 }, when: { keys: [["ping", "go"]] }, reducer: (s) => ({ n: s.n + 1 }) },
      },
      onCascade: (info) => cascades.push(info),
    });

    // An effect re-emitting its own trigger. Each hop is a separate drain, so `currentEvent`
    // cannot carry the cause — the scoped emit handed to effects is what does.
    store.registerEffect({
      when: { keys: [["ping", "go"]] },
      effect: async (_e, _get, emit) => {
        await emit("ping", "go", 1);
      },
    });

    await store.emit("ping", "go", 1);

    expect(cascades).toHaveLength(1);
    expect(cascades[0]!.limit).toBe("maxReduceDepth");
  });

  it("attributes an emit made through the store reference, not the injected one", async () => {
    quiet();
    const cascades: CascadeInfo<EM>[] = [];

    const store = createStore<{ a: State }, EM>({
      name: "captured-store",
      reducer: {
        a: { state: { n: 0 }, when: { keys: [["ping", "go"]] }, reducer: (s) => ({ n: s.n + 1 }) },
      },
      onCascade: (info) => cascades.push(info),
    });

    // The case a scoped closure cannot catch: a subscriber that closed over the store and never
    // touched the `emit` it was handed. Attribution must not depend on which reference a
    // consumer happened to reach for, so the drain tracks the event being processed instead.
    store.onEvent("ping", "go", () => {
      void store.emit("ping", "go", 1);
    });

    await store.emit("ping", "go", 1);

    expect(cascades).toHaveLength(1);
    expect(cascades[0]!.depth).toBe(65);
  });
});

describe("what the guard must not refuse", () => {
  it("lets a synchronous loop of sibling emits through untouched", async () => {
    const store = createStore<{ a: { n: number } }, EM>({
      name: "wide",
      reducer: {
        a: {
          state: { n: 0 },
          when: { keys: [["data", "upsert"]] },
          reducer: (s) => ({ n: s.n + 1 }),
        },
      },
      onCascade: () => {
        throw new Error("a flat burst is not a cascade");
      },
    });

    // `emit` drains to completion before returning, so this is a thousand drains of one event —
    // and every one of them is a root at depth 0. Application traffic can never accumulate
    // depth, which is what makes a default ceiling safe to ship.
    for (let i = 0; i < 1000; i++) void store.emit("data", "upsert", i);
    await Promise.resolve();

    expect(store.getState().a.n).toBe(1000);
  });

  it("lets a wide fan-out through — wide is not deep", async () => {
    const store = createStore<{ a: { n: number } }, EM>({
      name: "fanout",
      reducer: {
        a: {
          state: { n: 0 },
          when: { keys: [["data", "upsert"]] },
          reducer: (s) => ({ n: s.n + 1 }),
        },
      },
      onCascade: () => {
        throw new Error("a fan-out is not a cascade");
      },
    });

    // These 500 DO share one drain: they are emitted while it runs, so they queue into it. The
    // shape the width ceiling would catch and the depth ceiling correctly ignores — every one of
    // them is depth 1, not 1 through 500.
    store.onEvent("ping", "go", (_e, _get, emit) => {
      for (let i = 0; i < 500; i++) void emit("data", "upsert", i);
    });

    await store.emit("ping", "go", 1);

    expect(store.getState().a.n).toBe(500);
  });

  it("allows a chain deeper than a default-free store would tolerate, when configured", async () => {
    const seen: number[] = [];
    const store = createStore<{ a: State }, EM>({
      name: "deep",
      reducer: {
        a: { state: { n: 0 }, when: { keys: [["ping", "go"]] }, reducer: (s) => ({ n: s.n + 1 }) },
      },
      maxReduceDepth: 200,
    });

    store.onEvent("ping", "go", (e, _get, emit) => {
      seen.push(e.depth ?? 0);
      if ((e.depth ?? 0) < 100) void emit("ping", "go", 1);
    });

    await store.emit("ping", "go", 1);

    // 101 events, depth 0 through 100 — past the default, under the configured ceiling.
    expect(seen).toHaveLength(101);
    expect(seen.at(-1)).toBe(100);
  });
});

describe("causality on the event", () => {
  it("leaves a root event byte-identical to one built before causality existed", async () => {
    const seen: unknown[] = [];
    const store = createStore<{ a: State }, EM>({
      name: "root-shape",
      reducer: {
        a: { state: { n: 0 }, when: { keys: [["ping", "go"]] }, reducer: (s) => s },
      },
    });

    store.onEvent("ping", "go", (e) => {
      seen.push(e);
    });
    await store.emit("ping", "go", 1);

    // No `parentId`, no `depth`, no `meta` — the same rule metadata already follows, and the
    // reason `toStrictEqual` assertions in consumer suites keep passing.
    expect(Object.keys(seen[0] as object).sort()).toEqual(["channel", "id", "payload", "type"]);
  });

  it("carries parentId and depth on a caused event", async () => {
    const seen: Array<{ id: string; parentId?: string; depth?: number }> = [];
    const store = createStore<{ a: State }, EM>({
      name: "caused-shape",
      reducer: {
        a: { state: { n: 0 }, when: { any: true }, reducer: (s) => s },
      },
    });

    store.onEvent("ping", "go", (e, _get, emit) => {
      seen.push(e as never);
      void emit("pong", "go", 1);
    });
    store.onEvent("pong", "go", (e) => {
      seen.push(e as never);
    });

    await store.emit("ping", "go", 1);

    expect(seen[0]!.parentId).toBeUndefined();
    expect(seen[1]!.parentId).toBe(seen[0]!.id);
    expect(seen[1]!.depth).toBe(1);
  });
});

describe("reporting", () => {
  it("names the event and the chain on the console, hook or no hook", async () => {
    const error = quiet();
    const store = createStore<{ a: State }, EM>({
      name: "no-hook",
      reducer: {
        a: { state: { n: 0 }, when: { keys: [["ping", "go"]] }, reducer: (s) => s },
      },
    });

    store.onEvent("ping", "go", (_e, _get, emit) => {
      void emit("ping", "go", 1);
    });
    await store.emit("ping", "go", 1);

    // Without a console line, refusing the emit is indistinguishable from it never having been
    // emitted — the invisibility the guard exists to end.
    const message = error.mock.calls.map((c) => String(c[0])).find((m) => m.includes("Cascade"));
    expect(message).toContain("ping/go");
    expect(message).toContain("maxReduceDepth");
  });

  it("hands onCascade the refused event with its metadata and causal chain", async () => {
    quiet();
    const cascades: CascadeInfo<EM>[] = [];
    const store = createStore<{ a: State }, EM>({
      name: "meta-carried",
      reducer: {
        a: { state: { n: 0 }, when: { keys: [["ping", "go"]] }, reducer: (s) => s },
      },
      onCascade: (info) => cascades.push(info),
    });

    // Metadata is where a consumer puts the origin, the trace id, the tenant — exactly what is
    // needed to find which wiring produced the cycle. Dropping it from the report would leave
    // the diagnostic naming a channel and a type, which every event in the loop shares.
    store.onEvent("ping", "go", (_e, _get, emit) => {
      void emit("ping", "go", 1, { meta: { origin: "scheduler" } });
    });

    await store.emit("ping", "go", 1, { meta: { origin: "scheduler" } });

    const refused = cascades[0]!;
    expect(refused.event.meta).toEqual({ origin: "scheduler" });
    expect(refused.event.parentId).toBeDefined();
    // Bounded to the recent past: the useful part is the cycle at the end, not the sixty hops
    // of identical churn before it.
    expect(refused.chain.length).toBeLessThanOrEqual(16);
    expect(refused.chain.at(-1)).toBe(refused.event.parentId);
  });

  it("never refuses the caller's own event", async () => {
    quiet();
    const store = createStore<{ a: { n: number } }, EM>({
      name: "root-safe",
      reducer: {
        a: {
          state: { n: 0 },
          when: { keys: [["data", "upsert"]] },
          reducer: (s) => ({ n: s.n + 1 }),
        },
      },
      // Degenerate on purpose: even at zero, a root must still be processed. A ceiling that
      // dropped the event you just emitted would not be a cascade guard, it would be a fault.
      maxTransitionsPerDrain: 0,
    });

    await store.emit("data", "upsert", 1);

    expect(store.getState().a.n).toBe(1);
  });

  it("survives a throwing onCascade handler", async () => {
    quiet();
    const store = createStore<{ a: State }, EM>({
      name: "throwing-hook",
      reducer: {
        a: { state: { n: 0 }, when: { keys: [["ping", "go"]] }, reducer: (s) => s },
      },
      onCascade: () => {
        throw new Error("diagnostic blew up");
      },
    });

    store.onEvent("ping", "go", (_e, _get, emit) => {
      void emit("ping", "go", 1);
    });

    // A throwing diagnostic must not become the failure it was reporting.
    await expect(store.emit("ping", "go", 1)).resolves.toBeUndefined();
  });

  it("stops a wide burst when the width ceiling is opted into", async () => {
    quiet();
    const cascades: CascadeInfo<EM>[] = [];
    const store = createStore<{ a: { n: number } }, EM>({
      name: "narrow",
      reducer: {
        a: {
          state: { n: 0 },
          when: { keys: [["data", "upsert"]] },
          reducer: (s) => ({ n: s.n + 1 }),
        },
      },
      maxTransitionsPerDrain: 10,
      onCascade: (info) => cascades.push(info),
    });

    // Re-entrant, so they share one drain — a loop of top-level emits would be 25 separate
    // drains of one event each and would never reach the ceiling.
    store.onEvent("ping", "go", (_e, _get, emit) => {
      for (let i = 0; i < 25; i++) void emit("data", "upsert", i);
    });

    // Refused events still resolve. Abandoning them would hang any caller awaiting one, which is
    // the failure the ceiling exists to prevent arriving by another door.
    await expect(store.emit("ping", "go", 1)).resolves.toBeUndefined();

    // Ten, not nine: the ceiling counts what the drain *caused*, and the root `ping/go` that
    // started it is the caller's own event rather than part of the burst.
    expect(store.getState().a.n).toBe(10);
    expect(cascades[0]!.limit).toBe("maxTransitionsPerDrain");
  });
});
