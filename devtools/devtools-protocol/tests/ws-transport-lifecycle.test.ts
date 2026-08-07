import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { StoreCapabilities } from "../src/capabilities";
import { PROTOCOL_VERSION } from "../src/version";
import {
  ReconnectingWsClient,
  WS_OPEN,
  type DevtoolsSocketCallbacks,
  type DevtoolsSocketFactory,
  type ReconnectingWsConfig,
} from "../src/ws-transport";

/**
 * The reconnect state machine, driven by a fake socket.
 *
 * @remarks
 * The client takes its socket from an injected factory — that is what keeps it free of both
 * the browser `WebSocket` global and the `ws` package — so everything here is exercised
 * without a network: open it, close it, reject its handshake, and advance a fake clock over
 * the backoff.
 *
 * Worth having because this is the one piece every devtools agent depends on to reach the
 * hub, and because its coverage had been carried by a neighbouring module until that module
 * moved out of the package.
 */

const caps: StoreCapabilities = {
  replay: false,
  stateSnapshot: true,
  subscriptionMeta: true,
  pipelineMeta: true,
  emit: false,
};

/** A socket the test opens, closes and reads by hand. */
function fakeSockets() {
  const opened: Array<{
    url: string;
    callbacks: DevtoolsSocketCallbacks;
    sent: string[];
    closed: Array<{ code?: number; reason?: string }>;
    disposed: boolean;
    readyState: number;
  }> = [];

  let failNextCreate = false;

  const factory: DevtoolsSocketFactory = (url, callbacks) => {
    if (failNextCreate) {
      failNextCreate = false;
      throw new Error("socket construction failed");
    }
    const record = {
      url,
      callbacks,
      sent: [] as string[],
      closed: [] as Array<{ code?: number; reason?: string }>,
      disposed: false,
      readyState: WS_OPEN,
    };
    opened.push(record);
    return {
      get readyState() {
        return record.readyState;
      },
      send: (data: string) => record.sent.push(data),
      close: (code?: number, reason?: string) => record.closed.push({ code, reason }),
      dispose: () => {
        record.disposed = true;
      },
    };
  };

  return {
    factory,
    opened,
    latest: () => opened[opened.length - 1]!,
    failNextCreate: () => {
      failNextCreate = true;
    },
  };
}

const config = (over: Partial<ReconnectingWsConfig> = {}): ReconnectingWsConfig => ({
  autoReconnect: true,
  maxReconnectAttempts: 3,
  baseDelay: 100,
  maxDelay: 5000,
  ...over,
});

function build(over: Partial<ReconnectingWsConfig> = {}) {
  const sockets = fakeSockets();
  const client = new ReconnectingWsClient("store-1", "Store", caps, config(over), sockets.factory);
  return { client, sockets };
}

/** Opens and completes the handshake, leaving the client connected. */
function handshake(client: ReconnectingWsClient, sockets: ReturnType<typeof fakeSockets>) {
  sockets.latest().callbacks.onOpen();
  sockets.latest().callbacks.onMessage(
    JSON.stringify({ type: "HANDSHAKE_RESPONSE", success: true, protocolVersion: PROTOCOL_VERSION }),
  );
}

beforeEach(() => {
  vi.useFakeTimers();
});
afterEach(() => {
  vi.useRealTimers();
});

describe("connecting and handshaking", () => {
  it("dials the url it was given and states its identity", () => {
    const { client, sockets } = build();
    client.connect("127.0.0.1", 9000);

    expect(sockets.latest().url).toBe("ws://127.0.0.1:9000");
    expect(client.getState()).toBe("connecting");

    sockets.latest().callbacks.onOpen();
    const request = JSON.parse(sockets.latest().sent[0]!) as {
      type: string;
      protocolVersion: string;
      store: { id: string; name: string };
    };
    expect(request.type).toBe("HANDSHAKE_REQUEST");
    expect(request.protocolVersion).toBe(PROTOCOL_VERSION);
    expect(request.store).toMatchObject({ id: "store-1", name: "Store" });
  });

  it("presents an auth token when the hub requires one", () => {
    const { client, sockets } = build({ authToken: "sekrit" });
    client.connect("h", 1);
    sockets.latest().callbacks.onOpen();

    expect(JSON.parse(sockets.latest().sent[0]!)).toMatchObject({ authToken: "sekrit" });
  });

  it("omits the token entirely when there is none, rather than sending undefined", () => {
    const { client, sockets } = build();
    client.connect("h", 1);
    sockets.latest().callbacks.onOpen();

    expect("authToken" in (JSON.parse(sockets.latest().sent[0]!) as object)).toBe(false);
  });

  it("reports connected only once the hub accepts the handshake", () => {
    const { client, sockets } = build();
    const connected = vi.fn();
    client.onConnected(connected);

    client.connect("h", 1);
    sockets.latest().callbacks.onOpen();
    expect(connected).not.toHaveBeenCalled();
    expect(client.getState()).toBe("connecting");

    handshake(client, sockets);
    expect(connected).toHaveBeenCalledTimes(1);
    expect(client.getState()).toBe("connected");
  });

  it("closes the socket when the hub refuses the handshake", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const { client, sockets } = build();
    client.connect("h", 1);
    sockets.latest().callbacks.onOpen();

    sockets.latest().callbacks.onMessage(
      JSON.stringify({ type: "HANDSHAKE_RESPONSE", success: false, error: "bad token" }),
    );

    expect(sockets.latest().closed[0]).toEqual({ code: 1008, reason: "Handshake failed" });
    expect(client.getState()).not.toBe("connected");
    error.mockRestore();
  });

  it("ignores a malformed or unexpected frame during the handshake", () => {
    // A hub speaking something else must leave the client waiting, not crash it.
    const { client, sockets } = build();
    client.connect("h", 1);
    sockets.latest().callbacks.onOpen();

    expect(() => sockets.latest().callbacks.onMessage("{not json")).not.toThrow();
    expect(() =>
      sockets.latest().callbacks.onMessage(JSON.stringify({ type: "SOMETHING_ELSE" })),
    ).not.toThrow();
    expect(client.getState()).not.toBe("connected");
  });
});

describe("messages", () => {
  it("delivers post-handshake frames to the handler", () => {
    const { client, sockets } = build();
    const seen: string[] = [];
    client.onMessage((m) => seen.push(m));

    client.connect("h", 1);
    handshake(client, sockets);
    sockets.latest().callbacks.onMessage("hello");

    expect(seen).toEqual(["hello"]);
  });

  it("buffers while disconnected and flushes in order once accepted", () => {
    const { client, sockets } = build();
    client.send("a");
    client.send("b");

    client.connect("h", 1);
    handshake(client, sockets);

    // The handshake request is first; the buffered pair follows it, in order.
    expect(sockets.latest().sent.slice(1)).toEqual(["a", "b"]);
  });

  it("does not send before the handshake resolves, even on an open socket", () => {
    // Sending early would reach a hub that has not yet agreed what this connection is.
    const { client, sockets } = build();
    client.connect("h", 1);
    sockets.latest().callbacks.onOpen();

    client.send("early");
    expect(sockets.latest().sent).toHaveLength(1);
  });
});

describe("reconnecting", () => {
  it("backs off exponentially, with a floor", () => {
    const { client, sockets } = build({ baseDelay: 1000 });
    client.connect("h", 1);
    handshake(client, sockets);

    sockets.latest().callbacks.onClose();
    expect(client.getState()).toBe("reconnecting");
    expect(sockets.opened).toHaveLength(1);

    // First retry is at least the floor; nothing dials before it elapses.
    vi.advanceTimersByTime(700);
    expect(sockets.opened).toHaveLength(1);
    vi.advanceTimersByTime(500);
    expect(sockets.opened).toHaveLength(2);
  });

  it("gives up after the configured number of attempts", () => {
    const { client, sockets } = build({ maxReconnectAttempts: 2, baseDelay: 10 });
    client.connect("h", 1);
    handshake(client, sockets);

    for (let i = 0; i < 4; i++) {
      sockets.latest().callbacks.onClose();
      vi.advanceTimersByTime(10_000);
    }

    // One initial dial plus two retries, then it stops.
    expect(sockets.opened).toHaveLength(3);
    expect(client.getState()).toBe("disconnected");
  });

  it("stays down when auto-reconnect is off", () => {
    const { client, sockets } = build({ autoReconnect: false });
    client.connect("h", 1);
    handshake(client, sockets);

    sockets.latest().callbacks.onClose();
    vi.advanceTimersByTime(60_000);

    expect(sockets.opened).toHaveLength(1);
    expect(client.getState()).toBe("disconnected");
  });

  it("retries when the socket cannot even be constructed", () => {
    const { client, sockets } = build({ baseDelay: 10 });
    sockets.failNextCreate();

    client.connect("h", 1);
    expect(sockets.opened).toHaveLength(0);

    vi.advanceTimersByTime(10_000);
    expect(sockets.opened).toHaveLength(1);
  });

  it("announces each disconnection", () => {
    const { client, sockets } = build({ autoReconnect: false });
    const disconnected = vi.fn();
    client.onDisconnected(disconnected);

    client.connect("h", 1);
    handshake(client, sockets);
    sockets.latest().callbacks.onClose();

    expect(disconnected).toHaveBeenCalledTimes(1);
  });
});

describe("the epoch guard", () => {
  it("ignores callbacks from a socket that has been superseded", () => {
    // A socket replaced by a reconnect can still fire: its close or message must not be
    // mistaken for the live connection's, or one dead socket tears down its replacement.
    const { client, sockets } = build({ baseDelay: 10 });
    client.connect("h", 1);
    handshake(client, sockets);
    const stale = sockets.latest();

    stale.callbacks.onClose();
    vi.advanceTimersByTime(10_000);
    handshake(client, sockets);
    expect(client.getState()).toBe("connected");
    expect(sockets.opened).toHaveLength(2);

    // The old socket speaks again, far too late.
    const seen: string[] = [];
    client.onMessage((m) => seen.push(m));
    stale.callbacks.onMessage("from the grave");
    stale.callbacks.onClose();

    expect(seen).toEqual([]);
    expect(client.getState()).toBe("connected");
  });

  it("ignores a late callback from a socket abandoned by disconnect", () => {
    const { client, sockets } = build();
    client.connect("h", 1);
    handshake(client, sockets);
    const abandoned = sockets.latest();

    client.disconnect();
    abandoned.callbacks.onClose();

    expect(client.getState()).toBe("disconnected");
    expect(sockets.opened).toHaveLength(1);
  });
});

describe("disconnecting", () => {
  it("closes cleanly, drops the buffer and stops reconnecting", () => {
    const { client, sockets } = build();
    client.connect("h", 1);
    handshake(client, sockets);
    client.send("queued");

    client.disconnect();

    expect(sockets.latest().closed[0]).toEqual({ code: 1000, reason: "Client disconnect" });
    expect(sockets.latest().disposed).toBe(true);
    expect(client.getState()).toBe("disconnected");

    vi.advanceTimersByTime(60_000);
    expect(sockets.opened).toHaveLength(1);
  });

  it("cancels a pending reconnect", () => {
    const { client, sockets } = build({ baseDelay: 10 });
    client.connect("h", 1);
    handshake(client, sockets);
    sockets.latest().callbacks.onClose();

    client.disconnect();
    vi.advanceTimersByTime(60_000);

    expect(sockets.opened).toHaveLength(1);
  });

  it("connecting again after a disconnect works", () => {
    const { client, sockets } = build();
    client.connect("h", 1);
    handshake(client, sockets);
    client.disconnect();

    client.connect("h", 2);
    handshake(client, sockets);

    expect(sockets.opened).toHaveLength(2);
    expect(client.getState()).toBe("connected");
  });
});
