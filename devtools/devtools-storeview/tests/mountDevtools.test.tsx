import { act } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { mountDevtools } from "../src/index";

/**
 * The mounted panel presents the hub's token.
 *
 * A hub started with a token refuses any panel that does not send it. The mount config is the
 * hub connection config, so the token given here has to reach the handshake.
 */

const handshakes: Array<Record<string, unknown>> = [];

/** Records the handshake and accepts it, standing in for a hub. */
class RecordingSocket {
  onopen: (() => void) | null = null;
  onmessage: ((ev: { data: string }) => void) | null = null;
  onclose: (() => void) | null = null;
  onerror: (() => void) | null = null;
  readyState = 0;

  constructor(_url: string) {
    queueMicrotask(() => {
      this.readyState = 1;
      this.onopen?.();
    });
  }

  send(data: string): void {
    const msg = JSON.parse(data) as Record<string, unknown>;
    if (msg.type === "HANDSHAKE_REQUEST") handshakes.push(msg);
  }

  close(): void {
    this.readyState = 3;
    this.onclose?.();
  }
}

let unmount: (() => void) | undefined;
afterEach(() => {
  act(() => unmount?.());
  unmount = undefined;
  handshakes.length = 0;
});

describe("mountDevtools", () => {
  it("sends the configured token in the handshake", async () => {
    const container = document.createElement("div");
    await act(async () => {
      unmount = mountDevtools(container, {
        port: 0,
        autoReconnect: false,
        authToken: "s3cret",
        WebSocket: RecordingSocket as unknown as { new (url: string): WebSocket },
      });
      await new Promise((r) => setTimeout(r, 0));
    });

    expect(handshakes).toHaveLength(1);
    expect(handshakes[0]?.authToken).toBe("s3cret");
  });
});
