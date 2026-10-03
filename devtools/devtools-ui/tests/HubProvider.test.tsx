// @vitest-environment jsdom
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it } from "vitest";

import { HubProvider } from "../src/context/HubProvider";
import { useHubConnection } from "../src/hooks/useHubConnection";
import type { HubConnectionConfig } from "../src/types";

/**
 * A panel's side of the hub's token check.
 *
 * A hub started with a token refuses every handshake that does not carry it, panels included.
 * The provider had no way to send one, so no panel could use such a hub. The socket below plays
 * that hub: it answers the handshake by comparing the token it was sent.
 */

/** Records each handshake and accepts it only when it carries `expected`. */
function hubRequiring(expected: string | undefined) {
  const handshakes: Array<Record<string, unknown>> = [];

  class TokenCheckingSocket {
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
      if (msg.type !== "HANDSHAKE_REQUEST") return;
      handshakes.push(msg);
      const success = expected === undefined || msg.authToken === expected;
      queueMicrotask(() =>
        this.onmessage?.({
          data: JSON.stringify({
            type: "HANDSHAKE_RESPONSE",
            success,
            negotiatedVersion: "1.0.0",
            hubCapabilities: { maxHistorySize: 0, supportedFeatures: [] },
            ...(success ? {} : { error: "Invalid or missing auth token" }),
          }),
        }),
      );
    }

    close(): void {
      if (this.readyState === 3) return;
      this.readyState = 3;
      this.onclose?.();
    }
  }

  return {
    handshakes,
    WebSocket: TokenCheckingSocket as unknown as { new (url: string): WebSocket },
  };
}

function connect(hub: ReturnType<typeof hubRequiring>, extra: Partial<HubConnectionConfig>) {
  const config: HubConnectionConfig = {
    port: 0,
    autoReconnect: false,
    WebSocket: hub.WebSocket,
    ...extra,
  };
  const wrapper = ({ children }: { children: ReactNode }) => (
    <HubProvider config={config}>{children}</HubProvider>
  );
  return renderHook(() => useHubConnection(), { wrapper });
}

describe("HubProvider against a hub that requires a token", () => {
  it("connects with the right token", async () => {
    const hub = hubRequiring("s3cret");
    const { result } = connect(hub, { authToken: "s3cret" });

    await waitFor(() => expect(result.current.status).toBe("connected"));
    expect(hub.handshakes[0]?.authToken).toBe("s3cret");
  });

  it("does not connect with the wrong token", async () => {
    const hub = hubRequiring("s3cret");
    const { result } = connect(hub, { authToken: "wrong" });

    await waitFor(() => expect(hub.handshakes).toHaveLength(1));
    await waitFor(() => expect(result.current.status).toBe("disconnected"));
  });

  it("sends no token field when it has none", async () => {
    const hub = hubRequiring(undefined);
    const { result } = connect(hub, {});

    await waitFor(() => expect(result.current.status).toBe("connected"));
    expect("authToken" in (hub.handshakes[0] ?? {})).toBe(false);
  });
});
