/**
 * Service worker: joins a page's content script to its DevTools panel.
 *
 * @remarks
 * A content script can only talk to the extension, and a DevTools panel can only talk to the
 * extension — neither can address the other. The service worker is the only place that sees
 * both, so it keeps one pairing per inspected tab and copies frames across.
 *
 * It reads nothing. Pairing is by tab id and everything else is opaque, so this file cannot
 * drift from the protocol the two ends actually speak.
 *
 * @module @yoltra/devtools-ext
 */

const CHANNEL = "yoltra-devtools-bridge";
const PANEL_CHANNEL = "yoltra-devtools-panel";

/** Content-script port per tab. */
const pages = new Map<number, chrome.runtime.Port>();
/** Panel port per inspected tab. */
const panels = new Map<number, chrome.runtime.Port>();

/** Relays every frame from `from` to whichever port `lookup` currently holds for the tab. */
function pump(
  from: chrome.runtime.Port,
  tabId: number,
  lookup: Map<number, chrome.runtime.Port>,
): void {
  from.onMessage.addListener((message: unknown) => {
    const target = lookup.get(tabId);
    if (target === undefined) return; // the other half is not attached yet, or has gone
    try {
      target.postMessage(message);
    } catch {
      // The far end disconnected between the lookup and the post. Its own disconnect handler
      // does the cleanup; dropping the frame is the whole recovery.
    }
  });
}

chrome.runtime.onConnect.addListener((port) => {
  if (port.name === CHANNEL) {
    // A content script. Its tab is the one it runs in.
    const tabId = port.sender?.tab?.id;
    if (tabId === undefined) return;

    pages.set(tabId, port);
    pump(port, tabId, panels);
    port.onDisconnect.addListener(() => {
      if (pages.get(tabId) === port) pages.delete(tabId);
    });
    return;
  }

  if (port.name.startsWith(`${PANEL_CHANNEL}:`)) {
    // A panel names the tab it inspects, because a DevTools page has no sender tab of its own.
    const tabId = Number(port.name.slice(PANEL_CHANNEL.length + 1));
    if (!Number.isInteger(tabId)) return;

    panels.set(tabId, port);
    pump(port, tabId, pages);
    port.onDisconnect.addListener(() => {
      if (panels.get(tabId) === port) panels.delete(tabId);
    });
  }
});

// Module scope, not a global script: both bridge halves declare the same channel constant.
export {};
