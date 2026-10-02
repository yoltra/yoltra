import { afterEach, describe, expect, it, vi } from "vitest";

import { createStore, warnOnLargeValues } from "../../src/index";
import type { ReducerSpec } from "../../src/index";
import { measureValue } from "../../src/diagnostics/warnOnLargeValues";

/**
 * `warnOnLargeValues`: an opt-in development check for payloads and slices that grew past what
 * anyone intended. Nothing in the store refuses a large value, so this is where one is noticed.
 */

type EM = { data: { load: unknown; tick: number }; presence: { ping: unknown } };
type State = { rows: unknown };

const spec: ReducerSpec<State, EM> = {
  state: { rows: [] },
  when: { keys: [["data", "load"], ["presence", "ping"]] },
  // Copies what it stores, so the store's own by-reference warning stays out of these tests.
  reducer: (_s, event) => {
    const p = event.payload;
    return { rows: p instanceof Uint8Array ? p.slice() : Array.isArray(p) ? [...p] : p };
  },
};

const build = () =>
  createStore<{ table: State }, EM>({ name: "Big", reducer: { table: spec }, ephemeral: ["presence"] });

const rows = (n: number) => Array.from({ length: n }, (_, i) => ({ id: i }));

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

describe("measureValue", () => {
  it("counts every node, and bytes for strings, numbers, keys and binary data", () => {
    expect(measureValue({ a: "xyz", b: 1 }, 100, 1000)).toEqual({ nodes: 3, bytes: 3 + 8 + 2 });
    expect(measureValue(new Uint8Array(1024), 100, 10_000)).toEqual({ nodes: 1, bytes: 1024 });
    expect(measureValue(new Map([["k", new Set([1, 2])]]), 100, 1000).nodes).toBe(5);
  });

  it("stops as soon as a limit is passed, and survives a cycle", () => {
    const huge = rows(100_000);
    expect(measureValue(huge, 10, 1e9).nodes).toBe(11);

    const cyclic: { self?: unknown } = {};
    cyclic.self = cyclic;
    expect(measureValue(cyclic, 100, 1000).nodes).toBe(2);
  });
});

describe("warnOnLargeValues", () => {
  it("warns about a large payload and the slice it filled, once each, naming the store", async () => {
    const warn = vi.fn();
    const store = build();
    warnOnLargeValues(store, { maxPayloadNodes: 50, maxSliceNodes: 50, warn });

    await store.emit("data", "load", rows(100));
    await store.emit("data", "load", rows(200));

    expect(warn).toHaveBeenCalledTimes(2);
    const messages = warn.mock.calls.map((c) => c[0] as string);
    expect(messages[0]).toContain('Store "Big"');
    expect(messages[0]).toContain('payload of "data/load"');
    expect(messages[0]).toContain("more than 50 values");
    expect(messages[1]).toContain('slice "table"');
  });

  it("checks bytes as well as values", async () => {
    const warn = vi.fn();
    const store = build();
    warnOnLargeValues(store, { maxPayloadBytes: 1024, maxSliceBytes: 1e9, warn });

    await store.emit("data", "load", new Uint8Array(4096));

    expect(warn).toHaveBeenCalledOnce();
    expect(warn.mock.calls[0]![0]).toContain("more than about 1024 bytes");
    expect(warn.mock.calls[0]![1]).toMatchObject({ bytes: 4096 });
  });

  it("stays quiet under the limits, and for an event that did not commit", async () => {
    const warn = vi.fn();
    const store = createStore<{ table: State }, EM>({
      name: "Quiet",
      reducer: { table: spec },
      middleware: [(_s, event) => event.type !== "tick"],
    });
    warnOnLargeValues(store, { maxPayloadNodes: 5, warn });

    await store.emit("data", "load", rows(1));
    await store.emit("data", "tick", 1);

    expect(warn).not.toHaveBeenCalled();
  });

  it("checks traffic on an ephemeral channel too", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const warn = vi.fn();
    const store = build();
    warnOnLargeValues(store, { maxPayloadNodes: 10, maxSliceNodes: 1e9, warn });

    await store.emit("presence", "ping", rows(50));

    expect(warn).toHaveBeenCalledOnce();
  });

  it("writes to the console by default, and stops when unsubscribed", async () => {
    const consoleWarn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const store = build();
    const off = warnOnLargeValues(store, { maxPayloadNodes: 10, maxSliceNodes: 1e9 });

    off();
    await store.emit("data", "load", rows(50));
    expect(consoleWarn).not.toHaveBeenCalled();

    warnOnLargeValues(store, { maxPayloadNodes: 10, maxSliceNodes: 1e9 });
    await store.emit("data", "load", rows(60));
    expect(consoleWarn).toHaveBeenCalledOnce();
  });

  it("watches nothing in production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    const warn = vi.fn();
    const store = build();
    const instrument = vi.spyOn(store, "instrument");

    const off = warnOnLargeValues(store, { maxPayloadNodes: 1, warn });
    await store.emit("data", "load", rows(10));
    off();

    expect(instrument).not.toHaveBeenCalled();
    expect(warn).not.toHaveBeenCalled();
  });
});
