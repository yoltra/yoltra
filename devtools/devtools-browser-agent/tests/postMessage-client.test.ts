import { afterEach, describe, expect, it, vi } from "vitest";

import {
  BRIDGE_CHANNEL,
  createPostMessageSocketFactory,
  isBridgeMessage,
  type BridgeWindow,
} from "../src/postMessage-client";

/**
 * The page half of the hub-free attach path.
 *
 * Attaching the panel used to require a hub process, an edit to the application, and a
 * capability flag — three steps against Redux DevTools' one, at exactly the moment somebody is
 * deciding whether the tool is worth the trouble.
 */

/** A window the test drives, standing in for the page. */
function fakeWindow() {
  const listeners = new Set<(event: MessageEvent) => void>();
  const posted: unknown[] = [];

  const win: BridgeWindow = {
    postMessage: (message) => posted.push(message),
    addEventListener: (_type, listener) => listeners.add(listener),
    removeEventListener: (_type, listener) => listeners.delete(listener),
  };

  return {
    win,
    posted,
    listenerCount: () => listeners.size,
    /** Delivers a message as the browser would. */
    dispatch(data: unknown) {
      for (const l of [...listeners]) l({ data } as MessageEvent);
    },
  };
}

const tick = () => new Promise((r) => queueMicrotask(() => r(undefined)));

function callbacks() {
  return { onOpen: vi.fn(), onMessage: vi.fn(), onClose: vi.fn(), onError: vi.fn() };
}

describe("postMessage transport", () => {
  it("opens without a server to connect to", async () => {
    const page = fakeWindow();
    const cb = callbacks();

    const socket = createPostMessageSocketFactory(page.win)("ignored", cb);
    await tick();

    // There is no connection to establish, which is the point: no hub, no port, no process.
    expect(cb.onOpen).toHaveBeenCalledOnce();
    expect(socket.readyState).toBe(1);
  });

  it("posts outbound frames on its own channel", async () => {
    const page = fakeWindow();
    const socket = createPostMessageSocketFactory(page.win)("ignored", callbacks());
    await tick();

    socket.send('{"type":"HANDSHAKE_REQUEST"}');

    expect(page.posted).toEqual([
      { channel: BRIDGE_CHANNEL, direction: "to-panel", data: '{"type":"HANDSHAKE_REQUEST"}' },
    ]);
  });

  it("delivers inbound frames addressed to the page", async () => {
    const page = fakeWindow();
    const cb = callbacks();
    createPostMessageSocketFactory(page.win)("ignored", cb);
    await tick();

    page.dispatch({ channel: BRIDGE_CHANNEL, direction: "to-page", data: '{"type":"PING"}' });

    expect(cb.onMessage).toHaveBeenCalledWith('{"type":"PING"}');
  });

  it("ignores traffic that is not ours", async () => {
    const page = fakeWindow();
    const cb = callbacks();
    createPostMessageSocketFactory(page.win)("ignored", cb);
    await tick();

    // A page is a busy channel: application messages, other tools, framework devtools. Reacting
    // to any of it would be a bug in someone else's program surfacing as one in ours.
    page.dispatch({ type: "SOMETHING_ELSE" });
    page.dispatch("a string");
    page.dispatch({ channel: BRIDGE_CHANNEL, direction: "to-panel", data: "our own echo" });
    page.dispatch(null);

    expect(cb.onMessage).not.toHaveBeenCalled();
  });

  it("does not post after close, and detaches its listener", async () => {
    const page = fakeWindow();
    const cb = callbacks();
    const socket = createPostMessageSocketFactory(page.win)("ignored", cb);
    await tick();

    socket.close();

    expect(cb.onClose).toHaveBeenCalledOnce();
    expect(page.listenerCount()).toBe(0);
    socket.send("dropped");
    expect(page.posted).toHaveLength(0);
  });

  it("reports a closed socket where there is no window at all", () => {
    // Server rendering, or a worker. Throwing here would take down whatever imported the agent.
    const socket = createPostMessageSocketFactory(undefined as never)("ignored", callbacks());
    expect(socket.readyState).toBe(3);
  });

  it("buffers rather than failing when no relay answers", async () => {
    const page = fakeWindow();
    const cb = callbacks();
    const socket = createPostMessageSocketFactory(page.win)("ignored", callbacks());
    await tick();

    socket.send("handshake");

    // Nothing replies, because no extension is installed. The frame is posted into a page
    // nobody is relaying, the protocol handshake never resolves, and the client buffers exactly
    // as it does against a hub that is not running — one failure mode to explain, not two.
    expect(page.posted).toHaveLength(1);
    expect(cb.onClose).not.toHaveBeenCalled();
  });
});

describe("isBridgeMessage", () => {
  it("accepts only well-formed frames in the asked-for direction", () => {
    const frame = { channel: BRIDGE_CHANNEL, direction: "to-page", data: "{}" };

    expect(isBridgeMessage(frame, "to-page")).toBe(true);
    expect(isBridgeMessage(frame, "to-panel")).toBe(false);
    expect(isBridgeMessage({ ...frame, data: 42 }, "to-page")).toBe(false);
    expect(isBridgeMessage({ ...frame, channel: "other" }, "to-page")).toBe(false);
    expect(isBridgeMessage(undefined, "to-page")).toBe(false);
  });
});

describe("transport selection", () => {
  /**
   * Which way the agent reaches the panel, and why it matters: the whole point of the bridge is
   * that installing the extension is the only step. Requiring the developer to also pick a
   * transport would put the third step back.
   */
  const MARK = "__YOLTRA_DEVTOOLS_BRIDGE__";

  afterEach(() => {
    delete (globalThis as Record<string, unknown>)[MARK];
    vi.restoreAllMocks();
  });

  async function attach(config: Record<string, unknown>) {
    const { withDevtools } = await import("../src/withDevtools");
    const { createStore } = await import("@yoltra/core");
    const store = createStore({
      name: "t",
      reducer: { a: { state: { n: 0 }, when: { keys: [["x", "y"]] }, reducer: (s: unknown) => s } as never },
    });
    withDevtools(store as never, { port: 9800, ...config });
    return store;
  }

  it("uses the bridge when an extension has announced itself", async () => {
    (globalThis as Record<string, unknown>)[MARK] = true;
    const page = fakeWindow();
    // The transport reads the ambient window; this test environment has none, so supply one.
    (globalThis as Record<string, unknown>).window = page.win;

    const store = await attach({});
    await new Promise((r) => setTimeout(r, 10));

    // A handshake went out over postMessage rather than to a socket nobody is serving.
    expect(page.posted.some((m) => isBridgeMessage(m, "to-panel"))).toBe(true);
    store.dispose();
    delete (globalThis as Record<string, unknown>).window;
  });

  it("leaves an explicitly injected transport alone", async () => {
    (globalThis as Record<string, unknown>)[MARK] = true;
    const used = vi.fn(() => ({
      readyState: 3,
      send: () => undefined,
      close: () => undefined,
      dispose: () => undefined,
    }));

    const store = await attach({ socketFactory: used });

    // The embedded panel and the tests depend on this: an explicit transport always wins.
    expect(used).toHaveBeenCalled();
    store.dispose();
  });
});
