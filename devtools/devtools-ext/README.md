![Yoltra logo](../../assets/logo.svg)

# @yoltra/devtools-ext

> [ 🇲🇽 Versión en Español](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-ext/README.es.md)&nbsp;
> | &nbsp; 👉
> [ 🇺🇸 English Version](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-ext/README.md)&nbsp;

**Browser extension for Yoltra DevTools — Chrome and Firefox (Manifest V3).**

`@yoltra/devtools-ext` is a lightweight browser extension that adds a "Yoltra" panel to
Chrome/Firefox DevTools. The panel renders `@yoltra/devtools-storeview` and connects to the
DevTools hub running on localhost. A popup allows configuring the hub host and port.

---

## Features

- Adds a "Yoltra" tab in browser DevTools
- Full store inspector: events, state tree, subscriptions, time travel, emit, metrics
- Configurable hub connection via popup settings
- No content scripts or background service workers
- MV3 compatible (Chrome + Firefox)

---

## Installation

### From source (development)

```bash
# Build the extension
cd devtools/devtools-ext
pnpm build

# Load in Chrome:
# 1. Open chrome://extensions
# 2. Enable "Developer mode"
# 3. Click "Load unpacked"
# 4. Select the dist/ folder

# Load in Firefox:
# 1. Open about:debugging
# 2. Click "This Firefox"
# 3. Click "Load Temporary Add-on"
# 4. Select dist/manifest.json
```

---

## How It Works

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  Your App    │     │  DevTools    │     │  Extension   │
│  (with       │ WS  │  Hub         │ WS  │  Panel       │
│  withDevtools│────►│  (server)    │◄────│  (this pkg)  │
│  )           │     │              │     │              │
└──────────────┘     └──────────────┘     └──────────────┘
```

1. Your app instruments a store with `withDevtools()` — connects to the hub
2. The extension panel mounts `@yoltra/devtools-storeview` — connects to the same hub
3. Events and commands flow through the hub between store and panel

---

## Configuration

Click the extension popup icon to configure:

| Setting | Default     | Description         |
| ------- | ----------- | ------------------- |
| Host    | `localhost` | Hub server hostname |
| Port    | `9800`      | Hub server port     |

Settings are persisted in `chrome.storage.local`.

---

## Architecture

| File                            | Responsibility                                      |
| ------------------------------- | --------------------------------------------------- |
| `manifest.json`                 | MV3 extension manifest (permissions, devtools page) |
| `devtools.html` / `devtools.ts` | Registers the DevTools panel                        |
| `panel.html` / `panel.ts`       | Mounts `@yoltra/devtools-storeview` in the panel    |
| `popup.html` / `popup.ts`       | Hub connection settings UI                          |

---

## Prerequisites

The extension connects to a **running DevTools hub**. Start one using any of:

```bash
# Standalone server
npx @yoltra/devtools-server --port 9800

# Embedded in VS Code (auto-starts)
# Just install @yoltra/devtools-vscode

# Embedded in CLI
npx @yoltra/devtools-cli --port 9800
```

Then instrument your store:

```typescript
import { withDevtools } from "@yoltra/devtools-browser-agent";

withDevtools(store, { port: 9800 });
```

---

## Related Packages

- **[@yoltra/devtools-storeview](../devtools-storeview/README.md)** — The React UI rendered in
  the panel
- **[@yoltra/devtools-server](../devtools-server/README.md)** — The hub this extension connects
  to
- **[@yoltra/devtools-browser-agent](../devtools-browser-agent/README.md)** — Instruments
  browser stores
- **[@yoltra/devtools-protocol](../devtools-protocol/README.md)** — Wire format for hub
  communication

---

## License

**MIT** — Free to use in commercial and open-source projects.
