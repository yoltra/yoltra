import { afterEach, describe, expect, it, vi } from "vitest";

import { CallAbortedError, createStore } from "../../src/index";
import type { Diagnostic, ReducerSpec, Scheduler } from "../../src/index";

/**
 * A store's lifetime: `store.signal`, and what a disposed store does.
 *
 * Disposal used to clear the registries and leave the rest running: an `emit` after it still
 * went through the pipeline, a pending `call` waited for its idle timeout, and nothing told
 * work tied to the store that it was gone. A disposed store is now inert, and says so.
 */

type EM = { ui: { inc: number }; rpc: { ask: null; answer: null } };

const counter: ReducerSpec<{ n: number }, EM> = {
  state: { n: 0 },
  when: { keys: [["ui", "inc"]] },
  reducer: (s, event) => ({ n: s.n + (event.payload as number) }),
};

const build = (extra: { diagnostics?: (d: Diagnostic) => void; scheduler?: Scheduler } = {}) =>
  createStore<{ c: { n: number } }, EM>({ name: "Life", reducer: { c: counter }, ...extra });

/** A scheduler that only records what was armed. */
const recordingScheduler = () => {
  const armed: number[] = [];
  const scheduler: Scheduler = {
    setTimeout: (_run, delayMs) => armed.push(delayMs),
    clearTimeout: () => undefined,
  };
  return { armed, scheduler };
};

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

describe("store.signal", () => {
  it("is not created until read", () => {
    const store = build();
    expect((store as unknown as { lifetime: unknown }).lifetime).toBeUndefined();
    store.dispose();
    expect((store as unknown as { lifetime: unknown }).lifetime).toBeUndefined();
  });

  it("aborts once, on dispose, after the store has been emptied", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const store = build();
    const sub = vi.fn();
    store.subscribe(sub);
    const signal = store.signal;
    expect(signal.aborted).toBe(false);

    let emitDuringAbort: Promise<{ committed: boolean }> | undefined;
    const onAbort = vi.fn(() => {
      // Aborted last: by now the store is already inert.
      emitDuringAbort = store.emit("ui", "inc", 1);
    });
    signal.addEventListener("abort", onAbort);

    store.dispose();
    store.dispose();

    expect(signal.aborted).toBe(true);
    expect(signal.reason).toBe("store disposed");
    expect(onAbort).toHaveBeenCalledOnce();
    expect((await emitDuringAbort!).committed).toBe(false);
    expect(sub).not.toHaveBeenCalled();
  });

  it("is already aborted when first read after dispose", () => {
    const store = build();
    store.dispose();
    expect(store.signal.aborted).toBe(true);
  });
});

describe("a disposed store is inert", () => {
  it("does not run an emit, and resolves not committed", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const store = build();
    const seen = vi.fn();
    await store.emit("ui", "inc", 1);
    store.dispose();
    store.onEvent("ui", "inc", seen);

    const result = await store.emit("ui", "inc", 5);

    expect(result).toEqual({ committed: false, written: false });
    expect(store.getState().c.n).toBe(1);
    expect(seen).not.toHaveBeenCalled();
  });

  it("rejects a call at once, without sending it or arming a timer", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const { armed, scheduler } = recordingScheduler();
    const store = build({ scheduler });
    store.dispose();

    const call = store.call("rpc", "ask", null, { reply: ["rpc", "answer"], timeoutMs: 1000 });

    await expect(call).rejects.toBeInstanceOf(CallAbortedError);
    await expect(call).rejects.toThrow(/store disposed/);
    expect(armed).toEqual([]);
  });

  it("rejects a call still pending when the store is disposed", async () => {
    const store = build();
    const call = store.call("rpc", "ask", null, { reply: ["rpc", "answer"], timeoutMs: 60_000 });

    store.dispose();

    await expect(call).rejects.toThrow(/store disposed/);
  });

  it("refuses every registration, naming the store", () => {
    const store = build();
    store.dispose();

    const attempts: Array<[string, () => unknown]> = [
      ["registerReducer", () => store.registerReducer("x", counter)],
      ["registerSlice", () => store.registerSlice("x", counter)],
      ["withSlice", () => store.withSlice("x", counter)],
      ["registerMiddleware", () => store.registerMiddleware(() => true)],
      ["withMiddleware", () => store.withMiddleware(() => true)],
      ["registerEffect", () => store.registerEffect({ when: { any: true }, effect: () => undefined })],
      ["onEffect", () => store.onEffect("ui", "inc", () => undefined)],
      ["replaceReducers", () => store.replaceReducers({})],
      ["replaceMiddleware", () => store.replaceMiddleware([])],
      ["replaceEffects", () => store.replaceEffects([])],
      ["hotReplace", () => store.hotReplace({})],
    ];
    for (const [, attempt] of attempts) {
      expect(attempt).toThrow(/Store "Life" is disposed/);
    }
  });
});

describe("late use is said once, in development", () => {
  it("warns once per method, naming the store, through the diagnostics seam", async () => {
    const seen: Diagnostic[] = [];
    const store = build({ diagnostics: (d) => seen.push(d) });
    store.dispose();

    await store.emit("ui", "inc", 1);
    await store.emit("ui", "inc", 1);
    await store.call("rpc", "ask", null, { reply: ["rpc", "answer"] }).catch(() => undefined);

    expect(seen.map((d) => [d.code, d.detail?.method])).toEqual([
      ["use-after-dispose", "emit"],
      ["use-after-dispose", "call"],
    ]);
    expect(seen[0]!.message).toContain('Store "Life"');
  });

  it("stays silent in production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const store = build();
    store.dispose();

    await store.emit("ui", "inc", 1);

    expect(warn).not.toHaveBeenCalled();
  });
});

describe("a call whose signal is already aborted", () => {
  it("rejects without sending the request or arming a timer", async () => {
    const { armed, scheduler } = recordingScheduler();
    const store = build({ scheduler });
    const sent = vi.fn();
    store.onEvent("rpc", "ask", sent);

    const call = store.call("rpc", "ask", null, {
      reply: ["rpc", "answer"],
      signal: AbortSignal.abort("too late"),
    });

    await expect(call).rejects.toThrow(/too late/);
    expect(sent).not.toHaveBeenCalled();
    expect(armed).toEqual([]);
  });
});
