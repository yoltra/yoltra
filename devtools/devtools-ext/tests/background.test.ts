import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * The service worker is the only place that sees both halves of the bridge, so a fault here is
 * invisible from either end: the panel simply shows nothing, and the page reports no error.
 *
 * This package shipped with `"test": "exit 0"` — a script that reports success without running
 * anything, in a pipeline that gates releases. It is also the package whose build broke a release
 * train. These are the first tests it has had.
 */

const CHANNEL = "yoltra-devtools-bridge";
const PANEL_CHANNEL = "yoltra-devtools-panel";

type Frame = unknown;

/** A test double for `chrome.runtime.Port` that lets a test drive both listener lists. */
function makePort(name: string, senderTabId?: number) {
  const onMessage: Array<(m: Frame) => void> = [];
  const onDisconnect: Array<() => void> = [];

  return {
    name,
    sender: senderTabId === undefined ? undefined : { tab: { id: senderTabId } },
    onMessage: { addListener: (l: (m: Frame) => void) => onMessage.push(l) },
    onDisconnect: { addListener: (l: () => void) => onDisconnect.push(l) },
    postMessage: vi.fn(),
    /** Simulates the far end sending a frame. */
    send: (m: Frame) => onMessage.forEach((l) => l(m)),
    /** Simulates the far end going away. */
    drop: () => onDisconnect.forEach((l) => l()),
  };
}

type Port = ReturnType<typeof makePort>;

/** Loads the service worker against a fresh `chrome`, returning a way to connect ports. */
async function loadWorker(): Promise<(port: Port) => void> {
  const connectListeners: Array<(p: unknown) => void> = [];
  (globalThis as unknown as { chrome: unknown }).chrome = {
    runtime: { onConnect: { addListener: (l: (p: unknown) => void) => connectListeners.push(l) } },
  };

  vi.resetModules();
  await import("../src/background");

  return (port: Port) => connectListeners.forEach((l) => l(port));
}

let connect: (port: Port) => void;

beforeEach(async () => {
  connect = await loadWorker();
});

describe("pairing", () => {
  it("carries frames both ways once each half has attached", () => {
    const page = makePort(CHANNEL, 7);
    const panel = makePort(`${PANEL_CHANNEL}:7`);
    connect(page);
    connect(panel);

    page.send({ hello: "from page" });
    expect(panel.postMessage).toHaveBeenCalledWith({ hello: "from page" });

    panel.send({ hello: "from panel" });
    expect(page.postMessage).toHaveBeenCalledWith({ hello: "from panel" });
  });

  it("keeps tabs apart", () => {
    // The pairing key is the tab id, and getting this wrong would leak one page's state into
    // another page's panel — the worst failure this file could have.
    const pageOne = makePort(CHANNEL, 1);
    const panelTwo = makePort(`${PANEL_CHANNEL}:2`);
    connect(pageOne);
    connect(panelTwo);

    pageOne.send({ tab: 1 });

    expect(panelTwo.postMessage).not.toHaveBeenCalled();
  });

  it("drops a frame when the other half is not attached yet", () => {
    const page = makePort(CHANNEL, 3);
    connect(page);

    expect(() => page.send({ early: true })).not.toThrow();
  });

  it("survives the far end disconnecting between lookup and post", () => {
    const page = makePort(CHANNEL, 4);
    const panel = makePort(`${PANEL_CHANNEL}:4`);
    connect(page);
    connect(panel);
    panel.postMessage.mockImplementation(() => {
      throw new Error("Attempting to use a disconnected port object");
    });

    // Recovery is dropping the frame: the panel's own disconnect handler does the cleanup.
    expect(() => page.send({ racing: true })).not.toThrow();
  });
});

describe("registration", () => {
  it("ignores a content script with no sender tab", () => {
    const orphan = makePort(CHANNEL); // no sender.tab.id
    const panel = makePort(`${PANEL_CHANNEL}:9`);
    connect(orphan);
    connect(panel);

    orphan.send({ nowhere: true });

    expect(panel.postMessage).not.toHaveBeenCalled();
  });

  it("ignores a panel whose port name does not carry an integer tab id", () => {
    const page = makePort(CHANNEL, 5);
    const bogus = makePort(`${PANEL_CHANNEL}:not-a-number`);
    connect(page);
    connect(bogus);

    page.send({ frame: true });

    expect(bogus.postMessage).not.toHaveBeenCalled();
  });

  it("ignores a port with an unrelated name", () => {
    const stranger = makePort("some-other-extension", 6);
    expect(() => connect(stranger)).not.toThrow();
    expect(stranger.postMessage).not.toHaveBeenCalled();
  });
});

describe("disconnect", () => {
  it("stops relaying to a panel that has gone", () => {
    const page = makePort(CHANNEL, 10);
    const panel = makePort(`${PANEL_CHANNEL}:10`);
    connect(page);
    connect(panel);
    panel.drop();

    page.send({ afterClose: true });

    expect(panel.postMessage).not.toHaveBeenCalled();
  });

  it("does not let a stale port's disconnect evict its replacement", () => {
    // A reload connects the new content script before the old one's disconnect arrives. Deleting
    // by tab id alone would unregister the live port and silently kill the session — which is why
    // the handler checks identity before deleting.
    const first = makePort(CHANNEL, 11);
    const second = makePort(CHANNEL, 11);
    const panel = makePort(`${PANEL_CHANNEL}:11`);
    connect(first);
    connect(second);
    connect(panel);

    first.drop(); // the stale half, arriving late

    panel.send({ stillWorks: true });
    expect(second.postMessage).toHaveBeenCalledWith({ stillWorks: true });
  });
});
