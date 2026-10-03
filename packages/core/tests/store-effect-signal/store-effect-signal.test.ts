import { describe, expect, it } from "vitest";

import { createStore } from "../../src/index";
import type { EffectContext, ReducerSpec } from "../../src/index";

/**
 * `ctx.signal`: an effect learns that it stopped being registered.
 *
 * An effect that started a fetch had no way to know that a hot reload replaced it, that its
 * disposer ran, or that the store was disposed, so the request finished anyway and its result
 * landed in a store that no longer wanted it.
 */

type EM = { ui: { go: number; other: number; result: number } };

const log: ReducerSpec<{ results: number[] }, EM> = {
  state: { results: [] },
  when: { keys: [["ui", "result"]] },
  reducer: (s, event) => ({ results: [...s.results, event.payload as number] }),
};

const build = () => createStore<{ log: { results: number[] } }, EM>({ name: "Fx", reducer: { log } });

/** A promise settled from outside. */
function gate() {
  let open!: () => void;
  const opened = new Promise<void>((resolve) => (open = resolve));
  return { opened, open };
}

describe("ctx.signal", () => {
  it("is not created for an effect that never reads it", async () => {
    const store = build();
    store.registerEffect({ when: { keys: [["ui", "go"]] }, effect: () => undefined });
    await store.emit("ui", "go", 1);

    const [entry] = [...(store as unknown as { effects: Map<string, Set<{ ctx: object }>> }).effects.get("ui::go")!];
    expect((entry!.ctx as unknown as { controller: unknown }).controller).toBeUndefined();
  });

  it("is one signal per registration, shared across the keys it handles", async () => {
    const store = build();
    const signals: AbortSignal[] = [];
    store.registerEffect({
      when: { keys: [["ui", "go"], ["ui", "other"]] },
      effect: (_e, _get, _emit, ctx) => void signals.push(ctx.signal),
    });

    await store.emit("ui", "go", 1);
    await store.emit("ui", "other", 1);

    expect(signals).toHaveLength(2);
    expect(signals[0]).toBe(signals[1]);
    expect(signals[0]!.aborted).toBe(false);
  });

  it("aborts when the registration's disposer runs, without stopping the effect or dropping its emits", async () => {
    const store = build();
    const started = gate();
    const release = gate();
    let seen: AbortSignal | undefined;
    const reg = store.registerEffect({
      when: { keys: [["ui", "go"]] },
      effect: async (_e, _get, emit, ctx) => {
        seen = ctx.signal;
        started.open();
        await release.opened;
        // Still running after the abort, and its emit still lands.
        await emit("ui", "result", ctx.signal.aborted ? -1 : 1);
      },
    });

    const done = store.emit("ui", "go", 1);
    await started.opened;
    reg();
    expect(seen!.aborted).toBe(true);
    expect(seen!.reason).toBe("effect unregistered");

    release.open();
    await done;
    expect(store.getState().log.results).toEqual([-1]);
  });

  it("aborts only the effects replaceEffects removed", async () => {
    const store = createStore<{ log: { results: number[] } }, EM>({
      name: "Fx",
      reducer: { log },
      effects: [{ when: { keys: [["ui", "go"]] }, effect: (_e, _g, _m, ctx) => void (specSignal = ctx.signal) }],
    });
    let specSignal: AbortSignal | undefined;
    let dynamicSignal: AbortSignal | undefined;
    store.registerEffect({ when: { channel: "ui" }, effect: (_e, _g, _m, ctx) => void (dynamicSignal = ctx.signal) });
    await store.emit("ui", "go", 1);

    store.replaceEffects([]);

    expect(specSignal!.aborted).toBe(true);
    expect(specSignal!.reason).toBe("effect replaced");
    // Registered at runtime, so preserved by the default scope, and still live.
    expect(dynamicSignal!.aborted).toBe(false);
  });

  it("aborts what hotReplace removes", async () => {
    let signal: AbortSignal | undefined;
    const store = createStore<{ log: { results: number[] } }, EM>({
      name: "Fx",
      reducer: { log },
      effects: [{ when: { keys: [["ui", "go"]] }, effect: (_e, _g, _m, ctx) => void (signal = ctx.signal) }],
    });
    await store.emit("ui", "go", 1);

    store.hotReplace({ effects: [] });

    expect(signal!.aborted).toBe(true);
  });

  it("aborts every effect's signal when the store is disposed", async () => {
    const store = build();
    const signals: AbortSignal[] = [];
    store.registerEffect({ when: { keys: [["ui", "go"]] }, effect: (_e, _g, _m, ctx) => void signals.push(ctx.signal) });
    store.registerEffect({ when: { any: true }, effect: (_e, _g, _m, ctx) => void signals.push(ctx.signal) });
    await store.emit("ui", "go", 1);

    store.dispose();

    expect(signals.map((s) => [s.aborted, s.reason])).toEqual([
      [true, "store disposed"],
      [true, "store disposed"],
    ]);
  });

  it("is already aborted when first read after its registration ended", async () => {
    const store = build();
    let ctx: EffectContext | undefined;
    const reg = store.registerEffect({ when: { keys: [["ui", "go"]] }, effect: (_e, _g, _m, c) => void (ctx = c) });
    await store.emit("ui", "go", 1);

    reg();

    expect(ctx!.signal.aborted).toBe(true);
  });

  it("reaches an onEffect handler as its fifth argument", async () => {
    const store = build();
    let signal: AbortSignal | undefined;
    const off = store.onEffect("ui", "go", (_payload, _get, _emit, _event, ctx) => {
      signal = ctx.signal;
    });
    await store.emit("ui", "go", 1);

    off();

    expect(signal!.aborted).toBe(true);
  });
});
