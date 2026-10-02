import { afterEach, describe, expect, it, vi } from "vitest";

import { createStore } from "../../src/index";
import type { Diagnostic, InstrumentedEffects, ReducerSpec } from "../../src/index";

/**
 * `instrumentEffects`: the effect phase, observed.
 *
 * `instrument` reports an event after its reducers, before its effects, so nothing told an
 * observer when the effects finished, how long each took or which one failed. That is the first
 * thing a tracer shows, and it had no seam.
 */

type EM = {
  ui: { go: number; quiet: null; blocked: null };
  presence: { ping: null };
  rpc: { ask: null; answer: null };
};

const counter: ReducerSpec<{ n: number }, EM> = {
  state: { n: 0 },
  when: { keys: [["ui", "go"], ["ui", "blocked"]] },
  reducer: (s) => ({ n: s.n + 1 }),
};

const build = (extra: { diagnostics?: (d: Diagnostic) => void } = {}) =>
  createStore<{ c: { n: number } }, EM>({
    name: "Fx",
    reducer: { c: counter },
    ephemeral: ["presence"],
    middleware: [(_s, event) => event.type !== "blocked"],
    clock: { now: () => 7_000 },
    ...extra,
  });

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

afterEach(() => {
  vi.restoreAllMocks();
});

describe("instrumentEffects", () => {
  it("reports every effect of an event once they have all settled, in the order they ran", async () => {
    const store = build();
    const seen: InstrumentedEffects[] = [];
    store.instrumentEffects((info) => seen.push(info));

    store.registerEffect({
      when: { keys: [["ui", "go"]] },
      effect: async () => {
        await sleep(20);
      },
      meta: { type: "effect", name: "slow" },
    });
    store.registerEffect({ when: { channel: "ui" }, effect: function audit() {} });

    await store.emit("ui", "go", 1);

    expect(seen).toHaveLength(1);
    const info = seen[0]!;
    expect(info.event).toMatchObject({ channel: "ui", type: "go", payload: 1 });
    expect(info.at).toBe(7_000);
    expect(info.effects.map((e) => [e.name, e.origin, e.failed])).toEqual([
      ["slow", "dynamic", false],
      ["audit", "dynamic", false],
    ]);
    // A lower bound only: a timer never fires early by more than rounding.
    expect(info.effects[0]!.durationMs).toBeGreaterThanOrEqual(15);
    expect(info.durationMs).toBeGreaterThanOrEqual(info.effects[0]!.durationMs);
  });

  it("marks a failed effect, keeps running the rest, and still reports the error as a diagnostic", async () => {
    const diagnostics: Diagnostic[] = [];
    const store = build({ diagnostics: (d) => diagnostics.push(d) });
    const seen: InstrumentedEffects[] = [];
    store.instrumentEffects((info) => seen.push(info));
    store.registerEffect({
      when: { keys: [["ui", "go"]] },
      effect: function broken() {
        throw new Error("nope");
      },
    });
    const after = vi.fn();
    store.registerEffect({ when: { keys: [["ui", "go"]] }, effect: after });

    await store.emit("ui", "go", 1);

    expect(seen[0]!.effects.map((e) => e.failed)).toEqual([true, false]);
    expect(seen[0]!.effects[0]!.name).toBe("broken");
    expect(after).toHaveBeenCalledOnce();
    expect(diagnostics.map((d) => d.code)).toEqual(["effect-error"]);
  });

  it("names the store's own machinery as internal", async () => {
    const store = build();
    const seen: InstrumentedEffects[] = [];
    store.instrumentEffects((info) => seen.push(info));
    store.registerEffect({
      when: { keys: [["rpc", "ask"]] },
      effect: async (_e, _g, emit) => {
        await emit("rpc", "answer", null);
      },
    });

    await store.call("rpc", "ask", null, { reply: ["rpc", "answer"] });

    const answer = seen.find((i) => i.event.type === "answer")!;
    expect(answer.effects.map((e) => e.origin)).toEqual(["internal"]);
  });

  it("is silent for an event whose effects did not run: none registered, or vetoed", async () => {
    const store = build();
    const seen = vi.fn();
    store.instrumentEffects(seen);
    store.registerEffect({ when: { keys: [["ui", "blocked"]] }, effect: () => undefined });

    await store.emit("ui", "quiet", null);
    await store.emit("ui", "blocked", null);

    expect(seen).not.toHaveBeenCalled();
  });

  it("reports an ephemeral event only to observers that opted in", async () => {
    const store = build();
    const plain = vi.fn();
    const opted = vi.fn();
    store.instrumentEffects(plain);
    store.instrumentEffects(opted, { ephemeral: true });
    store.registerEffect({ when: { keys: [["presence", "ping"]] }, effect: () => undefined });

    await store.emit("presence", "ping", null);

    expect(plain).not.toHaveBeenCalled();
    expect(opted).toHaveBeenCalledOnce();
  });

  it("does no timing work while nobody observes", async () => {
    const store = build();
    store.registerEffect({ when: { keys: [["ui", "go"]] }, effect: () => undefined });
    const work = vi.spyOn(store as unknown as { emitEffectInstrumentation: () => void }, "emitEffectInstrumentation");

    await store.emit("ui", "go", 1);
    const off = store.instrumentEffects(() => undefined);
    await store.emit("ui", "go", 1);
    off();
    await store.emit("ui", "go", 1);

    expect(work).toHaveBeenCalledOnce();
  });

  it("contains a throwing observer and reports it", async () => {
    const diagnostics: Diagnostic[] = [];
    const store = build({ diagnostics: (d) => diagnostics.push(d) });
    store.instrumentEffects(() => {
      throw new Error("observer exploded");
    });
    const next = vi.fn();
    store.instrumentEffects(next);
    store.registerEffect({ when: { keys: [["ui", "go"]] }, effect: () => undefined });

    const result = await store.emit("ui", "go", 1);

    expect(result.committed).toBe(true);
    expect(next).toHaveBeenCalledOnce();
    expect(diagnostics).toEqual([
      expect.objectContaining({ code: "observer-error", detail: expect.objectContaining({ observer: "effects" }) }),
    ]);
  });

  it("is released by dispose", () => {
    const store = build();
    store.instrumentEffects(() => undefined, { ephemeral: true });
    store.dispose();
    const internals = store as unknown as { effectObservers: Set<unknown>; ephemeralEffectObservers: Set<unknown> };
    expect(internals.effectObservers.size + internals.ephemeralEffectObservers.size).toBe(0);
  });
});
