/**
 * The hub connection the popup saves and the panel reads.
 *
 * @remarks
 * Kept apart from `panel.ts` and `popup.ts`, which run against `chrome.*` and a DOM on load, so
 * the mapping from stored settings to a connection is testable on its own.
 *
 * @module @yoltra/devtools-ext
 */

import type { HubConnectionConfig } from "@yoltra/devtools-ui";

/** Hub host used when none is saved. */
export const DEFAULT_HOST = "localhost";
/** Hub port used when none is saved. */
export const DEFAULT_PORT = 9800;

/** Keys the settings live under in `chrome.storage.local`. */
export const SETTINGS_KEYS = ["hubHost", "hubPort", "hubToken"] as const;

/** What `chrome.storage.local.get(SETTINGS_KEYS)` returns: anything, or nothing, per key. */
export type StoredSettings = Partial<Record<(typeof SETTINGS_KEYS)[number], unknown>>;

/**
 * The connection the panel mounts with, from whatever is saved.
 *
 * @remarks
 * The token is stored beside the host and port and sent in the handshake: a hub started with a
 * token refuses a panel without it. An empty token means none.
 */
export function hubConnection(stored: StoredSettings): HubConnectionConfig {
  const host = typeof stored.hubHost === "string" && stored.hubHost ? stored.hubHost : DEFAULT_HOST;
  const port = typeof stored.hubPort === "number" && stored.hubPort > 0 ? stored.hubPort : DEFAULT_PORT;
  const token = typeof stored.hubToken === "string" && stored.hubToken ? stored.hubToken : undefined;
  return {
    host,
    port,
    extensionName: "Browser DevTools",
    autoReconnect: true,
    ...(token !== undefined ? { authToken: token } : {}),
  };
}
