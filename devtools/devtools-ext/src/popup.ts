/**
 * @module @yoltra/devtools-ext
 */

const hostInput = document.getElementById("host") as HTMLInputElement;
const portInput = document.getElementById("port") as HTMLInputElement;
const saveBtn = document.getElementById("save") as HTMLButtonElement;
const statusEl = document.getElementById("status") as HTMLDivElement;

// Load saved values
if (typeof chrome !== "undefined" && chrome.storage?.local) {
  chrome.storage.local.get(["hubHost", "hubPort"], (result) => {
    if (result.hubHost) hostInput.value = result.hubHost as string;
    if (result.hubPort) portInput.value = String(result.hubPort);
  });
}

saveBtn.addEventListener("click", () => {
  const host = hostInput.value.trim() || "localhost";
  const port = parseInt(portInput.value, 10) || 9800;

  if (typeof chrome !== "undefined" && chrome.storage?.local) {
    chrome.storage.local.set({ hubHost: host, hubPort: port }, () => {
      statusEl.textContent = "Saved! Reload the DevTools panel.";
      setTimeout(() => {
        statusEl.textContent = "";
      }, 3000);
    });
  }
});
