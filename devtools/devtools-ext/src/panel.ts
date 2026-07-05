/**
 * @module @yoltra/devtools-ext
 */

import { mountDevtools } from "@yoltra/devtools-storeview";

const DEFAULT_HOST = "localhost";
const DEFAULT_PORT = 9800;

/**
 * Initialize and mount the DevTools store-view UI inside the panel.
 *
 * Reads hub connection settings from `chrome.storage.local` and mounts
 * the devtools-storeview application into the `#root` element.
 */
async function init() {
  const root = document.getElementById("root");
  if (!root) return;

  // Load saved config from chrome.storage.local
  const config = await getConfig();

  mountDevtools(root, {
    host: config.host,
    port: config.port,
    extensionName: "Browser DevTools",
    autoReconnect: true,
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
