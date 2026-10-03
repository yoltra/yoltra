/**
 * @module @yoltra/devtools-ext
 */

import { DEFAULT_HOST, DEFAULT_PORT, SETTINGS_KEYS } from "./hub-config";

const hostInput = document.getElementById("host") as HTMLInputElement;
const portInput = document.getElementById("port") as HTMLInputElement;
const tokenInput = document.getElementById("token") as HTMLInputElement;
const saveBtn = document.getElementById("save") as HTMLButtonElement;
const statusEl = document.getElementById("status") as HTMLDivElement;

// Load saved values
if (typeof chrome !== "undefined" && chrome.storage?.local) {
  chrome.storage.local.get([...SETTINGS_KEYS], (result) => {
    if (result.hubHost) hostInput.value = result.hubHost as string;
    if (result.hubPort) portInput.value = String(result.hubPort);
    if (result.hubToken) tokenInput.value = result.hubToken as string;
  });
}

saveBtn.addEventListener("click", () => {
  const host = hostInput.value.trim() || DEFAULT_HOST;
  const port = parseInt(portInput.value, 10) || DEFAULT_PORT;
  // Empty means no token: the panel then connects to a hub running without one.
  const token = tokenInput.value.trim();

  if (typeof chrome !== "undefined" && chrome.storage?.local) {
    chrome.storage.local.set({ hubHost: host, hubPort: port, hubToken: token }, () => {
      statusEl.textContent = "Saved! Reload the DevTools panel.";
      setTimeout(() => {
        statusEl.textContent = "";
      }, 3000);
    });
  }
});
