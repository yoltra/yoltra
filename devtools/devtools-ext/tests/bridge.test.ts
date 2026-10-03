import { describe, expect, it, vi } from "vitest";

import type { DevtoolsSocketCallbacks } from "@yoltra/devtools-protocol";
import type { LoopbackHub } from "@yoltra/devtools-ui";

import { CHANNEL, bridgePage, type BridgePort } from "../src/bridge";

/**
 * The panel half of the bridge on its own: one broker connection per page socket, keyed by the
 * envelope's connection id, with the frames themselves passed through unread.
 * `bridge-stores.test.ts` drives the same code end to end with real agents.
 */

/** A broker stand-in that records each connection the bridge opens. */
function recordingHub() {
  const opened: Array<{
    url: string;
    sent: string[];
    closed: boolean;
    callbacks: DevtoolsSocketCallbacks;
  }> = [];
  const hub = {
    agentSocketFactory: (url: string, callbacks: DevtoolsSocketCallbacks) => {
      const conn = { url, sent: [] as string[], closed: false, callbacks };
      opened.push(conn);
      return {
        readyState: 1,
        send: (data: string) => void conn.sent.push(data),
        close: () => {
          conn.closed = true;
        },
        dispose: () => undefined,
      };
    },
    WebSocket: undefined as never,
  } as unknown as LoopbackHub;
  return { hub, opened };
}

function fakePort() {
  const onMessage: Array<(m: unknown) => void> = [];
  const onDisconnect: Array<() => void> = [];
  const port = {
    postMessage: vi.fn(),
    onMessage: { addListener: (l: (m: unknown) => void) => void onMessage.push(l) },
    onDisconnect: { addListener: (l: () => void) => void onDisconnect.push(l) },
  };
  return {
    port: port as BridgePort & { postMessage: ReturnType<typeof vi.fn> },
    fromPage: (m: unknown) => onMessage.forEach((l) => l(m)),
    drop: () => onDisconnect.forEach((l) => l()),
  };
}

describe("bridgePage", () => {
  it("opens one broker connection per page socket", () => {
    const { hub, opened } = recordingHub();
    const page = fakePort();
    bridgePage(hub, page.port);

    page.fromPage({ channel: CHANNEL, data: "a1", connection: "a" });
    page.fromPage({ channel: CHANNEL, data: "b1", connection: "b" });
    page.fromPage({ channel: CHANNEL, data: "a2", connection: "a" });

    expect(opened.map((c) => c.sent)).toEqual([["a1", "a2"], ["b1"]]);
  });

  it("addresses the broker's replies to the page socket they belong to", () => {
    const { hub, opened } = recordingHub();
    const page = fakePort();
    bridgePage(hub, page.port);
    page.fromPage({ channel: CHANNEL, data: "hello", connection: "a" });

    opened[0]?.callbacks.onMessage("reply");

    expect(page.port.postMessage).toHaveBeenCalledWith({
      channel: CHANNEL,
      data: "reply",
      connection: "a",
    });
  });

  it("keeps frames without a connection on one shared connection, as before ids", () => {
    const { hub, opened } = recordingHub();
    const page = fakePort();
    bridgePage(hub, page.port);

    page.fromPage({ channel: CHANNEL, data: "one" });
    page.fromPage({ channel: CHANNEL, data: "two" });
    opened[0]?.callbacks.onMessage("reply");

    expect(opened).toHaveLength(1);
    expect(page.port.postMessage).toHaveBeenCalledWith({ channel: CHANNEL, data: "reply" });
  });

  it("ends a connection when its socket says it closed, and only that one", () => {
    const { hub, opened } = recordingHub();
    const page = fakePort();
    bridgePage(hub, page.port);
    page.fromPage({ channel: CHANNEL, data: "a1", connection: "a" });
    page.fromPage({ channel: CHANNEL, data: "b1", connection: "b" });

    page.fromPage({ channel: CHANNEL, data: "", connection: "a", closed: true });
    // A notice for a connection that is already gone, or never existed, changes nothing.
    page.fromPage({ channel: CHANNEL, data: "", connection: "a", closed: true });
    page.fromPage({ channel: CHANNEL, data: "", connection: "zzz", closed: true });

    expect(opened.map((c) => c.closed)).toEqual([true, false]);
  });

  it("ends every connection when the page goes away", () => {
    const { hub, opened } = recordingHub();
    const page = fakePort();
    bridgePage(hub, page.port);
    page.fromPage({ channel: CHANNEL, data: "a1", connection: "a" });
    page.fromPage({ channel: CHANNEL, data: "b1", connection: "b" });

    page.drop();

    expect(opened.map((c) => c.closed)).toEqual([true, true]);
  });

  it.each([
    ["null", null],
    ["a primitive", "text"],
    ["a foreign channel", { channel: "other", data: "x" }],
    ["a non-string payload", { channel: CHANNEL, data: 42 }],
  ])("ignores %s", (_label, message) => {
    const { hub, opened } = recordingHub();
    const page = fakePort();
    bridgePage(hub, page.port);

    page.fromPage(message);

    expect(opened).toHaveLength(0);
  });

  it("drops a reply when the tab has gone", () => {
    const { hub, opened } = recordingHub();
    const page = fakePort();
    bridgePage(hub, page.port);
    page.fromPage({ channel: CHANNEL, data: "hello", connection: "a" });
    page.port.postMessage.mockImplementation(() => {
      throw new Error("Attempting to use a disconnected port object");
    });

    expect(() => opened[0]?.callbacks.onMessage("reply")).not.toThrow();
  });
});
