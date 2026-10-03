import { afterEach, describe, expect, it, vi } from "vitest";

import { Rejected, createStore } from "../../src/index";
import type { Diagnostic, DiagnosticCode, ReducerSpec } from "../../src/index";

/**
 * One diagnostics seam: `StoreSpec.diagnostics` for the store's owner, `store.onDiagnostic` for
 * anyone attached later.
 *
 * Failures used to be observable only through hooks set when the store was created, and the
 * store's own warnings went straight to the console. Code that decorates a store someone else
 * built could see neither. Now every failure, refusal and development warning is one
 * `Diagnostic`, routed one way: to the owner's sink, or to the console exactly as before when
 * there is none, and to every runtime observer in addition.
 */

type EM = {
  ui: { boom: null; fine: null; refuse: null; obj: { n: number } };
  ping: { go: number };
  pong: { go: number };
};

type State = { n: number };

const sliceSpec = (overrides: Partial<ReducerSpec<State, EM>> = {}): ReducerSpec<State, EM> => ({
  state: { n: 0 },
  when: { keys: [["ui", "boom"], ["ui", "fine"], ["ui", "refuse"]] },
  reducer(state, event) {
    if (event.type === "boom") throw new Error("reducer exploded");
    if (event.type === "refuse") return Rejected("not now");
    return { n: state.n + 1 };
  },
  ...overrides,
});

const quiet = () => {
  vi.spyOn(console, "error").mockImplementation(() => undefined);
  vi.spyOn(console, "warn").mockImplementation(() => undefined);
};

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

const codes = (seen: Diagnostic[]): DiagnosticCode[] => seen.map((d) => d.code);

describe("each failure reaches the spec sink and a runtime observer", () => {
  it("a reducer that throws", async () => {
    const sink: Diagnostic[] = [];
    const observed: Diagnostic[] = [];
    const store = createStore<{ a: State }, EM>({ name: "D", reducer: { a: sliceSpec() }, diagnostics: (d) => sink.push(d) });
    store.onDiagnostic((d) => observed.push(d));

    await store.emit("ui", "boom", null);

    for (const seen of [sink, observed]) {
      expect(codes(seen)).toEqual(["reducer-error"]);
      expect(seen[0]!.level).toBe("error");
      expect(seen[0]!.detail).toMatchObject({ slice: "a", event: { channel: "ui", type: "boom" } });
      expect((seen[0]!.detail!.error as Error).message).toBe("reducer exploded");
    }
  });

  it("an effect that throws", async () => {
    const seen: Diagnostic[] = [];
    const store = createStore<{ a: State }, EM>({ name: "D", reducer: { a: sliceSpec() }, diagnostics: (d) => seen.push(d) });
    store.registerEffect({
      when: { keys: [["ui", "fine"]] },
      effect: () => {
        throw new Error("effect exploded");
      },
    });

    await store.emit("ui", "fine", null);

    expect(codes(seen)).toEqual(["effect-error"]);
    expect(seen[0]!.message).toContain("ui/fine");
  });

  it("an event subscriber and a connect handler that throw", async () => {
    const seen: Diagnostic[] = [];
    const store = createStore<{ a: State }, EM>({ name: "D", reducer: { a: sliceSpec() }, diagnostics: (d) => seen.push(d) });
    store.onEvent("ui", "fine", () => {
      throw new Error("subscriber exploded");
    });
    store.connect({ reducer: "a", property: "n" }, () => {
      throw new Error("connect exploded");
    });

    await store.emit("ui", "fine", null);

    expect(codes(seen).sort()).toEqual(["connect-error", "subscriber-error"]);
    expect(seen.find((d) => d.code === "subscriber-error")!.detail).toMatchObject({ phase: "committed" });
  });

  it("a middleware that throws, which vetoes the event", async () => {
    const seen: Diagnostic[] = [];
    const store = createStore<{ a: State }, EM>({
      name: "D",
      reducer: { a: sliceSpec() },
      middleware: [
        () => {
          throw new Error("guard exploded");
        },
      ],
      diagnostics: (d) => seen.push(d),
    });

    const result = await store.emit("ui", "fine", null);

    expect(result.committed).toBe(false);
    expect(codes(seen)).toEqual(["middleware-error"]);
  });

  it("a cascade, with the chain in its detail", async () => {
    const seen: Diagnostic[] = [];
    const store = createStore<{ a: State }, EM>({
      name: "D",
      reducer: { a: { state: { n: 0 }, when: { keys: [["ping", "go"], ["pong", "go"]] }, reducer: (s) => ({ n: s.n + 1 }) } },
      maxReduceDepth: 4,
      diagnostics: (d) => seen.push(d),
    });
    store.onEvent("ping", "go", (_e, _get, emit) => void emit("pong", "go", 1));
    store.onEvent("pong", "go", (_e, _get, emit) => void emit("ping", "go", 1));

    await store.emit("ping", "go", 1);

    const cascade = seen.find((d) => d.code === "cascade")!;
    expect(cascade.level).toBe("error");
    expect(cascade.detail).toMatchObject({ limit: "maxReduceDepth", limitValue: 4 });
    expect(Array.isArray(cascade.detail!.chain)).toBe(true);
  });

  it("a refusal, at info level", async () => {
    const seen: Diagnostic[] = [];
    const store = createStore<{ a: State }, EM>({ name: "D", reducer: { a: sliceSpec() }, diagnostics: (d) => seen.push(d) });

    await store.emit("ui", "refuse", null);

    expect(seen).toHaveLength(1);
    expect(seen[0]).toMatchObject({ level: "info", code: "rejected", detail: { slice: "a" } });
    expect((seen[0]!.detail!.rejection as { reason: string }).reason).toBe("not now");
  });

  it("an instrumentation observer that throws", async () => {
    const seen: Diagnostic[] = [];
    const store = createStore<{ a: State }, EM>({ name: "D", reducer: { a: sliceSpec() }, diagnostics: (d) => seen.push(d) });
    store.instrument(() => {
      throw new Error("observer exploded");
    });

    await store.emit("ui", "fine", null);

    expect(codes(seen)).toEqual(["observer-error"]);
    expect(seen[0]!.detail).toMatchObject({ observer: "instrument" });
  });
});

describe("the on* hooks keep working", () => {
  it("are called as well as the sink", async () => {
    const onReducerError = vi.fn();
    const onEffectError = vi.fn();
    const onRejected = vi.fn();
    const sink = vi.fn();
    const store = createStore<{ a: State }, EM>({
      name: "D",
      reducer: { a: sliceSpec() },
      onReducerError,
      onEffectError,
      onRejected,
      diagnostics: sink,
    });
    store.registerEffect({
      when: { keys: [["ui", "fine"]] },
      effect: () => {
        throw new Error("x");
      },
    });

    await store.emit("ui", "boom", null);
    await store.emit("ui", "fine", null);
    await store.emit("ui", "refuse", null);

    expect(onReducerError).toHaveBeenCalledOnce();
    expect(onEffectError).toHaveBeenCalledOnce();
    expect(onRejected).toHaveBeenCalledOnce();
    expect(sink).toHaveBeenCalledTimes(3);
  });
});

describe("console output", () => {
  it("is exactly what it was when no sink is set", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const store = createStore<{ a: State }, EM>({ name: "D", reducer: { a: sliceSpec() } });
    const thrown = new Error("effect exploded");
    store.registerEffect({
      when: { keys: [["ui", "fine"]] },
      effect: () => {
        throw thrown;
      },
    });

    await store.emit("ui", "boom", null);
    await store.emit("ui", "fine", null);
    await store.emit("ui", "refuse", null);

    expect(error.mock.calls[0]![0]).toBe('Reducer error in slice "a":');
    expect(error.mock.calls[1]).toEqual(["Effect error:", thrown]);
    // A refusal was never logged and still is not.
    expect(error).toHaveBeenCalledTimes(2);
  });

  it("is replaced by the sink when one is set", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const store = createStore<{ a: State }, EM>({ name: "D", reducer: { a: sliceSpec() }, diagnostics: () => undefined });

    await store.emit("ui", "boom", null);

    expect(error).not.toHaveBeenCalled();
    expect(warn).not.toHaveBeenCalled();
  });

  it("is not silenced by a runtime observer, which only observes", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const store = createStore<{ a: State }, EM>({ name: "D", reducer: { a: sliceSpec() } });
    const observer = vi.fn();
    store.onDiagnostic(observer);

    await store.emit("ui", "boom", null);

    expect(observer).toHaveBeenCalledOnce();
    expect(error).toHaveBeenCalledOnce();
  });
});

describe("a throwing sink or observer is contained", () => {
  it("does not break the store or stop the other observers", async () => {
    const after = vi.fn();
    const store = createStore<{ a: State }, EM>({
      name: "D",
      reducer: { a: sliceSpec() },
      diagnostics: () => {
        throw new Error("sink exploded");
      },
    });
    store.onDiagnostic(() => {
      throw new Error("observer exploded");
    });
    store.onDiagnostic(after);

    await store.emit("ui", "boom", null);
    const result = await store.emit("ui", "fine", null);

    expect(after).toHaveBeenCalledOnce();
    expect(result.committed).toBe(true);
    expect(store.getState().a.n).toBe(1);
  });
});

describe("observer lifetime", () => {
  it("stops after unsubscribing, and is released by dispose", async () => {
    quiet();
    const store = createStore<{ a: State }, EM>({ name: "D", reducer: { a: sliceSpec() } });
    const first = vi.fn();
    const second = vi.fn();
    const off = store.onDiagnostic(first);
    store.onDiagnostic(second);

    off();
    await store.emit("ui", "boom", null);
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledOnce();

    store.dispose();
    expect((store as unknown as { diagnosticObservers: Set<unknown> }).diagnosticObservers.size).toBe(0);
  });
});

describe("development warnings go through the seam", () => {
  it("names each with its code", async () => {
    const seen: Diagnostic[] = [];
    const store = createStore<{ a: Record<string, unknown> }, EM>({
      name: "Warn",
      reducer: {
        a: {
          state: {},
          when: { keys: [["ui", "obj"]] },
          // Keeps the payload by reference and writes a dotted key: two warnings.
          reducer: (_s, event) => ({ kept: event.payload, "x.y": 1 }),
        },
      },
      diagnostics: (d) => seen.push(d),
    });

    await store.emit("ui", "obj", { n: 1 });
    await store.emit("a::b" as never, "c" as never, null as never);
    await store.emit("a" as never, "b::c" as never, null as never);

    expect(codes(seen).sort()).toEqual(["dotted-key", "key-collision", "payload-by-reference"]);
    expect(seen.every((d) => d.level === "warn")).toBe(true);
    expect(seen.find((d) => d.code === "key-collision")!.detail).toMatchObject({ key: "a::b::c" });
  });

  it("are not sent in production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    const seen: Diagnostic[] = [];
    const store = createStore<{ a: Record<string, unknown> }, EM>({
      name: "Prod",
      reducer: {
        a: { state: {}, when: { keys: [["ui", "obj"]] }, reducer: (_s, event) => ({ kept: event.payload, "x.y": 1 }) },
      },
      diagnostics: (d) => seen.push(d),
    });

    await store.emit("ui", "obj", { n: 1 });

    expect(seen).toEqual([]);
  });
});
