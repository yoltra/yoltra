/**
 * @module @yoltra/devtools-ext
 */

import { mountDevtools } from "@yoltra/devtools-storeview";
import { createLoopbackHub, type HubConnectionConfig } from "@yoltra/devtools-ui";

import { bridgePage } from "./bridge";
import { SETTINGS_KEYS, hubConnection } from "./hub-config";

const PANEL_CHANNEL = "yoltra-devtools-panel";

/**
 * Initialize and mount the DevTools store-view UI inside the panel.
 *
 * @remarks
 * Two ways in, tried in order.
 *
 * **The bridge.** When this panel is inspecting a tab, the page's agent is reachable through the
 * content script and no server is involved: installing the extension is the whole setup. The
 * panel plays the part the hub would — the in-memory broker already speaks the protocol, so the
 * page is attached to it as an ordinary peer and the UI connects to it as it would to a real
 * hub. That is why this file contains no routing logic: a second implementation of the protocol
 * living in an extension, where none of the test suites reach, would drift from the one both
 * ends actually speak.
 *
 * **The hub.** Remote sessions, and a page whose extension is not relaying, still need a socket,
 * so the previous behaviour is the fallback rather than a replacement.
 */
async function init() {
  const root = document.getElementById("root");
  if (!root) return;

  const tabId = chrome?.devtools?.inspectedWindow?.tabId;
  if (typeof tabId === "number") {
    mountBridged(root, tabId);
    return;
  }

  mountDevtools(root, await getConfig());
}

/**
 * Attaches the inspected page to an in-panel broker, then mounts the UI against it.
 *
 * @param root - Element to mount into.
 * @param tabId - Tab this panel inspects; names the port so the service worker can pair them.
 */
function mountBridged(root: HTMLElement, tabId: number): void {
  const hub = createLoopbackHub();
  bridgePage(hub, chrome.runtime.connect({ name: `${PANEL_CHANNEL}:${tabId}` }));

  mountDevtools(root, {
    port: 0,
    WebSocket: hub.WebSocket,
    extensionName: "Browser DevTools",
    autoReconnect: false,
  });
}

/**
 * Retrieve hub connection configuration from `chrome.storage.local`.
 *
 * Falls back to `localhost:9800` without a token when storage is unavailable or empty.
 *
 * @returns A promise resolving to the connection the panel mounts with.
 */
function getConfig(): Promise<HubConnectionConfig> {
  return new Promise((resolve) => {
    if (typeof chrome !== "undefined" && chrome.storage?.local) {
      chrome.storage.local.get([...SETTINGS_KEYS], (result) => resolve(hubConnection(result)));
    } else {
      resolve(hubConnection({}));
    }
  });
}

init();
