import { afterEach, describe, expect, it, vi } from "vitest";

import { createStore, persist } from "../../src/index";
import type { Diagnostic, InstrumentedEvent, ReducerSpec } from "../../src/index";

/**
 * Ephemeral channels: traffic, not history.
 *
 * A presence ping, a cursor position or a progress tick is handled like any event, but recording
 * it is waste: a devtools timeline of ten thousand cursor moves hides the three events that
 * matter, and every observer pays per event. An ephemeral channel's events reach only the
 * instrumentation observers that ask for them, and replay skips them.
 */

type EM = {
  presence: { ping: { who: string }; move: { x: number } };
  doc: { edit: string };
};

type State = { pings: number; text: string; x: number };

const spec: ReducerSpec<State, EM> = {
  state: { pings: 0, text: "", x: 0 },
  when: { keys: [["doc", "edit"], ["presence", "move"]] },
  reducer(state, event) {
    if (event.type === "edit") return { ...state, text: event.payload as string };
    if (event.type === "move") return { ...state, x: (event.payload as { x: number }).x };
    return state;
  },
};

const build = (extra: { diagnostics?: (d: Diagnostic) => void } = {}) =>
  createStore<{ s: State }, EM>({
    name: "Ephemeral",
    reducer: { s: spec },
    ephemeral: ["presence"],
    devtools: { allowReplay: true },
    ...extra,
  });

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

describe("an ephemeral event is handled as usual", () => {
  it("reaches subscribers and effects", async () => {
    const store = build();
    const subscriber = vi.fn();
    const effect = vi.fn();
    store.onEvent("presence", "ping", subscriber);
    store.registerEffect({ when: { keys: [["presence", "ping"]] }, effect });

    const result = await store.emit("presence", "ping", { who: "ana" });

    expect(result.committed).toBe(true);
    expect(subscriber).toHaveBeenCalledOnce();
    expect(effect).toHaveBeenCalledOnce();
  });
});

describe("instrumentation", () => {
  it("delivers an ephemeral event only to observers that opted in", async () => {
    const store = build();
    const history: InstrumentedEvent[] = [];
    const everything: InstrumentedEvent[] = [];
    store.instrument((info) => history.push(info));
    store.instrument((info) => everything.push(info), { ephemeral: true });

    await store.emit("presence", "ping", { who: "ana" });
    await store.emit("doc", "edit", "hello");

    expect(history.map((i) => i.event.type)).toEqual(["edit"]);
    expect(everything.map((i) => i.event.type)).toEqual(["ping", "edit"]);
  });

  it("does no instrumentation work for an ephemeral event while nobody opted in", async () => {
    const store = build();
    store.instrument(() => undefined);
    const work = vi.spyOn(store as unknown as { emitInstrumentation: () => void }, "emitInstrumentation");

    await store.emit("presence", "ping", { who: "ana" });
    expect(work).not.toHaveBeenCalled();

    await store.emit("doc", "edit", "hello");
    expect(work).toHaveBeenCalledOnce();
  });

  it("stops delivering to an observer once it unsubscribes", async () => {
    const store = build();
    const seen = vi.fn();
    const off = store.instrument(seen, { ephemeral: true });

    off();
    await store.emit("presence", "ping", { who: "ana" });
    await store.emit("doc", "edit", "x");

    expect(seen).not.toHaveBeenCalled();
  });
});

describe("replay skips ephemeral events", () => {
  it("reproduces the history without them", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const store = build();
    const base = store.getState();

    store.__replayEvents(base, [
      { channel: "doc", type: "edit", payload: "replayed", id: "e1" },
      { channel: "presence", type: "move", payload: { x: 99 }, id: "e2" },
    ]);

    expect(store.getState().s.text).toBe("replayed");
    expect(store.getState().s.x).toBe(0);
  });
});

describe("an ephemeral event that writes state", () => {
  it("is warned about once per event, in development", async () => {
    const seen: Diagnostic[] = [];
    const store = build({ diagnostics: (d) => seen.push(d) });

    await store.emit("presence", "ping", { who: "ana" }); // writes nothing: no warning
    await store.emit("presence", "move", { x: 1 });
    await store.emit("presence", "move", { x: 2 });

    expect(seen.map((d) => d.code)).toEqual(["ephemeral-write"]);
    expect(seen[0]!.message).toContain('"presence/move"');
    expect(store.getState().s.x).toBe(2);
  });

  it("is not warned about in production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    const seen: Diagnostic[] = [];
    const store = build({ diagnostics: (d) => seen.push(d) });

    await store.emit("presence", "move", { x: 1 });

    expect(seen).toEqual([]);
  });

  it("is still persisted, because persistence opts in", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const store = build();
    const write = vi.fn();
    const stop = persist(store, { key: "k", adapter: { read: () => null, write, remove: () => undefined }, version: 1, throttleMs: 0 });

    await store.emit("presence", "move", { x: 5 });

    expect(write).toHaveBeenCalledOnce();
    expect(write.mock.calls[0]![1]).toContain('"x":5');
    stop();
  });
});
