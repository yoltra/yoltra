import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * The page ↔ extension relay. Its source says it is "deliberately not a filter or a policy point"
 * because a second implementation of the protocol here would drift from the one both ends share,
 * and notes that the file "has no test harness available to catch that drift". It has one now.
 *
 * The globals are stubbed rather than supplied by jsdom on purpose: what this file touches is a
 * short, explicit list — two `window` methods, two `document` ones and `chrome.runtime.connect` —
 * and naming them makes the isolated-world constraint visible instead of hiding it behind an
 * environment.
 */

const CHANNEL = "yoltra-devtools-bridge";

function setup() {
  const messageListeners: Array<(e: unknown) => void> = [];
  const portListeners: Array<(m: unknown) => void> = [];
  const appended: Array<{ textContent: string; removed: boolean }> = [];

  const postMessage = vi.fn();
  const portPost = vi.fn();

  const win = {
    addEventListener: (type: string, l: (e: unknown) => void) => {
      if (type === "message") messageListeners.push(l);
    },
    postMessage,
  };

  const head = {
    appendChild: (node: { textContent: string; removed: boolean }) => appended.push(node),
  };

  (globalThis as unknown as Record<string, unknown>).window = win;
  (globalThis as unknown as Record<string, unknown>).document = {
    createElement: () => {
      const node = {
        textContent: "",
        removed: false,
        remove() {
          this.removed = true;
        },
      };
      return node;
    },
    head,
    documentElement: head,
  };
  (globalThis as unknown as Record<string, unknown>).chrome = {
    runtime: {
      connect: () => ({
        onMessage: { addListener: (l: (m: unknown) => void) => portListeners.push(l) },
        postMessage: portPost,
      }),
    },
  };

  return {
    win,
    postMessage,
    portPost,
    appended,
    /** Simulates the page posting into its own window. */
    fromPage: (data: unknown, source: unknown = win) =>
      messageListeners.forEach((l) => l({ source, data })),
    /** Simulates the panel sending a frame down the port. */
    fromPanel: (m: unknown) => portListeners.forEach((l) => l(m)),
  };
}

type Harness = ReturnType<typeof setup>;
let h: Harness;

beforeEach(async () => {
  h = setup();
  vi.resetModules();
  await import("../src/content-script");
});

describe("announcing the bridge", () => {
  it("sets the flag through an injected script, not a content-script global", () => {
    // A content script runs in an isolated world, so assigning the global here would be invisible
    // to the page and every agent would silently fall back to a hub. The injected script is the
    // whole point, and it is removed once it has run.
    expect(h.appended).toHaveLength(1);
    expect(h.appended[0].textContent).toContain("__YOLTRA_DEVTOOLS_BRIDGE__ = true");
    expect(h.appended[0].removed).toBe(true);
  });
});

describe("page → panel", () => {
  it("forwards a well-formed frame", () => {
    h.fromPage({ channel: CHANNEL, direction: "to-panel", data: "payload" });

    expect(h.portPost).toHaveBeenCalledWith({ channel: CHANNEL, data: "payload" });
  });

  it("ignores a message from a nested frame", () => {
    // Without the source check, an iframe could post into our window and be relayed as though it
    // were the page under inspection.
    h.fromPage({ channel: CHANNEL, direction: "to-panel", data: "payload" }, { notWindow: true });

    expect(h.portPost).not.toHaveBeenCalled();
  });

  it.each([
    ["a foreign channel", { channel: "other", direction: "to-panel", data: "x" }],
    ["the wrong direction", { channel: CHANNEL, direction: "to-page", data: "x" }],
    ["a non-string payload", { channel: CHANNEL, direction: "to-panel", data: 42 }],
    ["null", null],
    ["a primitive", "just a string"],
  ])("ignores %s", (_label, data) => {
    h.fromPage(data);

    expect(h.portPost).not.toHaveBeenCalled();
  });

  it("keeps the page running when the panel has closed", () => {
    h.portPost.mockImplementation(() => {
      throw new Error("Attempting to use a disconnected port object");
    });

    expect(() =>
      h.fromPage({ channel: CHANNEL, direction: "to-panel", data: "payload" }),
    ).not.toThrow();
  });
});

describe("panel → page", () => {
  it("posts a frame into the page, stamped with its direction", () => {
    h.fromPanel({ channel: CHANNEL, data: "down" });

    expect(h.postMessage).toHaveBeenCalledWith(
      { channel: CHANNEL, direction: "to-page", data: "down" },
      "*",
    );
  });

  it.each([
    ["a foreign channel", { channel: "other", data: "x" }],
    ["a non-string payload", { channel: CHANNEL, data: { nested: true } }],
    ["null", null],
    ["a primitive", 7],
  ])("ignores %s", (_label, message) => {
    h.fromPanel(message);

    expect(h.postMessage).not.toHaveBeenCalled();
  });
});
