import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import { createStore, type ReducerSpec } from "@yoltra/core";

import { withDevtools } from "../src/withDevtools";

/**
 * Minimal fake WebSocket: captures sends and auto-completes the DevTools
 * handshake so we can drive the full agent flow without a real hub.
 */
class FakeWebSocket {
  static OPEN = 1;
  static CONNECTING = 0;
  static last: FakeWebSocket | null = null;

  readyState = FakeWebSocket.OPEN;
  sent: string[] = [];
  onopen: (() => void) | null = null;
  onmessage: ((ev: { data: string }) => void) | null = null;
  onclose: (() => void) | null = null;
  onerror: (() => void) | null = null;

  constructor(public url: string) {
    FakeWebSocket.last = this;
    // Open on the next microtask, after the client attaches its handlers.
    queueMicrotask(() => this.onopen?.());
  }

  send(data: string) {
    this.sent.push(data);
    const msg = JSON.parse(data);
    if (msg.type === "HANDSHAKE_REQUEST") {
      queueMicrotask(() =>
        this.onmessage?.({
          data: JSON.stringify({
            type: "HANDSHAKE_RESPONSE",
            success: true,
            negotiatedVersion: msg.protocolVersion,
            hubCapabilities: { maxHistorySize: 1000, supportedFeatures: [] },
          }),
        }),
      );
    }
  }

  close() {
    this.readyState = 3;
    this.onclose?.();
  }

  parsed(type: string): any[] {
    return this.sent.map((s) => JSON.parse(s)).filter((m) => m.type === type);
  }
}

type EM = { counter: { increment: number } };
type CounterState = { value: number };

const counterSpec: ReducerSpec<CounterState, EM> = {
  state: { value: 0 },
  events: [["counter", "increment"]],
  reducer(state, event) {
    if (event.type === "increment") return { value: state.value + (event.payload as number) };
    return state;
  },
};

describe("withDevtools integration", () => {
  const realWs = (globalThis as any).WebSocket;

  beforeEach(() => {
    (globalThis as any).WebSocket = FakeWebSocket as any;
    FakeWebSocket.last = null;
  });

  afterEach(() => {
    (globalThis as any).WebSocket = realWs;
  });

  it("sends a STORE_EVENT with precise leaf patches built from the instrument seam", async () => {
    const store = createStore({ name: "App", reducer: { counter: counterSpec } });
    withDevtools(store, { port: 9999 });

    await store.emit("counter", "increment", 5);

    // The event is buffered until the fake handshake completes, then flushed.
    await vi.waitFor(() => {
      expect(FakeWebSocket.last!.parsed("STORE_EVENT").length).toBeGreaterThan(0);
    });

    const storeEvent = FakeWebSocket.last!.parsed("STORE_EVENT")[0];
    expect(storeEvent.committed).toBe(true);
    expect(storeEvent.event.channel).toBe("counter");
    expect(storeEvent.event.type).toBe("increment");
    expect(storeEvent.event.payload).toBe(5);
    // Precise leaf patch built from changedPaths + values — no full-subtree replace.
    expect(storeEvent.patches).toEqual([{ op: "replace", path: "/counter/value", value: 5 }]);
  });

  it("answers REQUEST_METRICS with real reduce timing and typed introspection", async () => {
    const store = createStore({ name: "MetricsApp", reducer: { counter: counterSpec } });
    withDevtools(store, { port: 9999 });

    await store.emit("counter", "increment", 1);
    await store.emit("counter", "increment", 2);

    // A flushed STORE_EVENT means the handshake completed and the buffer drained.
    await vi.waitFor(() => {
      expect(FakeWebSocket.last!.parsed("STORE_EVENT").length).toBeGreaterThan(0);
    });

    // Simulate the extension asking for metrics.
    FakeWebSocket.last!.onmessage?.({ data: JSON.stringify({ type: "REQUEST_METRICS" }) });

    await vi.waitFor(() => {
      expect(FakeWebSocket.last!.parsed("STORE_METRICS").length).toBeGreaterThan(0);
    });

    const metrics = FakeWebSocket.last!.parsed("STORE_METRICS")[0].metrics;
    expect(metrics.eventCount).toBe(2);
    expect(metrics.reducerCount).toBe(1);
    // avgProcessingTimeMs is now real (from reduceTimeMs), not the old hardcoded 0.
    expect(metrics.avgProcessingTimeMs).toBeGreaterThanOrEqual(0);
    expect(typeof metrics.queueDepth).toBe("number");
    expect(typeof metrics.dedupHits).toBe("number");
  });
});
