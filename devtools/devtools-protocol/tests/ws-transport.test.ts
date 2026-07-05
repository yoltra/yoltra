import { describe, it, expect } from "vitest";

import type { StoreCapabilities } from "../src/capabilities";
import { ReconnectingWsClient, WS_CONNECTING, type DevtoolsSocketFactory } from "../src/ws-transport";

const caps: StoreCapabilities = {
  replay: false,
  stateSnapshot: true,
  subscriptionMeta: true,
  pipelineMeta: true,
  emit: false,
};

describe("ReconnectingWsClient backpressure", () => {
  it("drops the oldest message and signals backpressure on buffer overflow", () => {
    // A socket that never opens, so send() always buffers (we never call connect).
    const factory: DevtoolsSocketFactory = () => ({
      readyState: WS_CONNECTING,
      send() {},
      close() {},
      dispose() {},
    });

    const client = new ReconnectingWsClient(
      "store-1",
      "Store",
      caps,
      { autoReconnect: false, maxReconnectAttempts: 0, baseDelay: 1, maxDelay: 1, maxBufferSize: 3 },
      factory,
    );

    const drops: number[] = [];
    client.onBackpressure((d) => drops.push(d));

    for (let i = 0; i < 5; i++) client.send(`m${i}`);

    // Buffer holds 3; 5 sent → 2 dropped, each signalled with the running total.
    expect(client.getDroppedCount()).toBe(2);
    expect(drops).toEqual([1, 2]);
  });

  it("does not drop or signal while within the buffer limit", () => {
    const factory: DevtoolsSocketFactory = () => ({
      readyState: WS_CONNECTING,
      send() {},
      close() {},
      dispose() {},
    });
    const client = new ReconnectingWsClient(
      "store-2",
      "Store",
      caps,
      { autoReconnect: false, maxReconnectAttempts: 0, baseDelay: 1, maxDelay: 1, maxBufferSize: 10 },
      factory,
    );

    let signalled = false;
    client.onBackpressure(() => {
      signalled = true;
    });

    for (let i = 0; i < 10; i++) client.send(`m${i}`);

    expect(client.getDroppedCount()).toBe(0);
    expect(signalled).toBe(false);
  });
});
