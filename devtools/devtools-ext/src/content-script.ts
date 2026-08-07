/**
 * Page ↔ extension relay.
 *
 * @remarks
 * A page and a DevTools panel in the same browser cannot address each other directly: the page
 * has `window.postMessage`, the panel has `chrome.runtime`, and only a content script sees both.
 * This is that content script, and it does nothing else — it announces itself to the page, then
 * carries protocol frames between the two channels without reading them.
 *
 * Deliberately not a filter or a policy point. Anything that inspects or rewrites frames here
 * would be a second implementation of the protocol, drifting from the one both ends share, and
 * this file has no test harness available to catch that drift.
 *
 * @module @yoltra/devtools-ext
 */

const CHANNEL = "yoltra-devtools-bridge";

/**
 * Marks the page as relayed, before application code runs.
 *
 * @remarks
 * The agent checks this to choose between the bridge and a hub. It is set from an injected
 * script rather than assigned here because a content script runs in an isolated world: a global
 * set in this file is invisible to the page, which is the single easiest thing to get wrong
 * about content scripts and would leave every agent silently falling back to the hub.
 */
function announce(): void {
  const script = document.createElement("script");
  script.textContent = "window.__YOLTRA_DEVTOOLS_BRIDGE__ = true;";
  (document.head ?? document.documentElement).appendChild(script);
  script.remove();
}

/** `true` when `value` is one of our frames travelling in `direction`. */
function isFrame(value: unknown, direction: "to-panel" | "to-page"): boolean {
  if (value === null || typeof value !== "object") return false;
  const msg = value as Record<string, unknown>;
  return msg.channel === CHANNEL && msg.direction === direction && typeof msg.data === "string";
}

function start(): void {
  announce();

  const port = chrome.runtime.connect({ name: CHANNEL });

  // Page → panel. Only frames from this window: `event.source` guards against a nested frame
  // posting into ours and being relayed as though it were the page under inspection.
  window.addEventListener("message", (event: MessageEvent) => {
    if (event.source !== window) return;
    if (!isFrame(event.data, "to-panel")) return;
    try {
      port.postMessage({ channel: CHANNEL, data: (event.data as { data: string }).data });
    } catch {
      // The panel closed. The page keeps running, and the agent keeps buffering, exactly as it
      // would against a hub that went away.
    }
  });

  // Panel → page.
  port.onMessage.addListener((message: unknown) => {
    if (message === null || typeof message !== "object") return;
    const msg = message as Record<string, unknown>;
    if (msg.channel !== CHANNEL || typeof msg.data !== "string") return;
    window.postMessage({ channel: CHANNEL, direction: "to-page", data: msg.data }, "*");
  });
}

start();

// Module scope, not a global script: both bridge halves declare the same channel constant.
export {};
