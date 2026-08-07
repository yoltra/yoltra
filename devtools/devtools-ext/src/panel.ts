/**
 * @module @yoltra/devtools-ext
 */

import { mountDevtools } from "@yoltra/devtools-storeview";
import { createLoopbackHub } from "@yoltra/devtools-ui";

const DEFAULT_HOST = "localhost";
const DEFAULT_PORT = 9800;
const CHANNEL = "yoltra-devtools-bridge";
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
 * **The hub.** Node processes, remote sessions, and a page whose extension is not relaying still
 * need a socket, so the previous behaviour is the fallback rather than a replacement.
 */
async function init() {
  const root = document.getElementById("root");
  if (!root) return;

  const tabId = chrome?.devtools?.inspectedWindow?.tabId;
  if (typeof tabId === "number") {
    mountBridged(root, tabId);
    return;
  }

  const config = await getConfig();
  mountDevtools(root, {
    host: config.host,
    port: config.port,
    extensionName: "Browser DevTools",
    autoReconnect: true,
  });
}

/**
 * Attaches the inspected page to an in-panel broker, then mounts the UI against it.
 *
 * @param root - Element to mount into.
 * @param tabId - Tab this panel inspects; names the port so the service worker can pair them.
 */
function mountBridged(root: HTMLElement, tabId: number): void {
  const hub = createLoopbackHub();
  const port = chrome.runtime.connect({ name: `${PANEL_CHANNEL}:${tabId}` });

  // The page joins the broker as an ordinary peer: frames it sends are handed to the broker, and
  // frames the broker addresses to it go back over the port. Nothing here inspects them.
  const pageSocket = hub.agentSocketFactory("bridge://page", {
    onOpen: () => undefined,
    onClose: () => undefined,
    onError: () => undefined,
    onMessage: (raw: string) => {
      try {
        port.postMessage({ channel: CHANNEL, data: raw });
      } catch {
        // The tab went away; its content script reconnects on reload.
      }
    },
  });

  port.onMessage.addListener((message: unknown) => {
    if (message === null || typeof message !== "object") return;
    const msg = message as Record<string, unknown>;
    if (msg.channel !== CHANNEL || typeof msg.data !== "string") return;
    pageSocket.send(msg.data);
  });

  port.onDisconnect.addListener(() => pageSocket.close());

  mountDevtools(root, {
    port: 0,
    WebSocket: hub.WebSocket,
    extensionName: "Browser DevTools",
    autoReconnect: false,
  });
}

interface ExtensionConfig {
  host: string;
  port: number;
}

/**
 * Retrieve hub connection configuration from `chrome.storage.local`.
 *
 * Falls back to `localhost:9800` when storage is unavailable or empty.
 *
 * @returns A promise resolving to the host and port configuration.
 */
function getConfig(): Promise<ExtensionConfig> {
  return new Promise((resolve) => {
    if (typeof chrome !== "undefined" && chrome.storage?.local) {
      chrome.storage.local.get(["hubHost", "hubPort"], (result) => {
        resolve({
          host: (result.hubHost as string) || DEFAULT_HOST,
          port: (result.hubPort as number) || DEFAULT_PORT,
        });
      });
    } else {
      resolve({ host: DEFAULT_HOST, port: DEFAULT_PORT });
    }
  });
}

init();
