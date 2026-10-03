![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

# @yoltra/devtools-ext

> [ 🇲🇽 Versión en Español](./README.es.md)&nbsp; | 👉 🇺🇸 English Version &nbsp;

**Browser extension for Yoltra DevTools — Chrome and Firefox (Manifest V3).**

`@yoltra/devtools-ext` is a lightweight browser extension that adds a "Yoltra" panel to
Chrome/Firefox DevTools. The panel renders `@yoltra/devtools-storeview` and connects to the
DevTools hub running on localhost. A popup allows configuring the hub host, port and token.

---

## Features

- Adds a "Yoltra" tab in browser DevTools
- Full store inspector: events, state tree, subscriptions, time travel, emit, metrics
- Configurable hub connection via popup settings
- Inspects a page **without a hub**: a content script relays protocol frames and a service worker
  pairs each page with the panel inspecting its tab
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

The panel reaches a page's store in one of two ways. Inside DevTools it uses the bridge: the
content script and the service worker carry frames between the page and the panel, and the panel
runs its own in-memory broker (`createLoopbackHub`), so no server is involved. Outside that
context it connects to a hub over a WebSocket. None of the relays reads or rewrites a frame.

```mermaid
flowchart TD
    page(["your app: withDevtools(store)"])
    hubNode(["a hub: devtools-server or devtools-cli"])

    page --> mark{"transport auto:<br/>__YOLTRA_DEVTOOLS_BRIDGE__ set?"}
    mark -->|"yes"| pm["postMessage transport<br/>channel yoltra-devtools-bridge"]
    mark -->|"no"| ws["WebSocket to host:port"]

    subgraph ext ["@yoltra/devtools-ext"]
    direction TB
        cs["content-script.ts<br/>document_start: injects the mark,<br/>relays frames without reading them"]
        bg["background.ts service worker<br/>pairs page and panel ports by tab id"]
        dt["devtools.ts<br/>creates the Yoltra panel"] --> panel{"panel.ts:<br/>inspectedWindow.tabId?"}
        panel -->|"yes"| bridged["mountBridged and bridge.ts<br/>createLoopbackHub, one store connection<br/>per page socket"]
        panel -->|"no"| direct["mountDevtools to hubHost:hubPort<br/>default localhost:9800"]
        popup["popup.ts<br/>saves hubHost, hubPort and hubToken"] -.->|"chrome.storage.local"| direct
        bridged --> loopUi["mountDevtools<br/>WebSocket = the loopback class"]
    end

    cs -.->|"window.__YOLTRA_DEVTOOLS_BRIDGE__ = true"| mark
    pm <-->|"window.postMessage, to-panel and to-page"| cs
    cs <-->|"runtime port yoltra-devtools-bridge"| bg
    bg <-->|"runtime port yoltra-devtools-panel:tabId"| bridged
    ws <-->|"WebSocket"| hubNode
    direct <-->|"WebSocket"| hubNode
```

1. On every `http://` and `https://` page, the content script injects an inline script that sets
   `__YOLTRA_DEVTOOLS_BRIDGE__` at `document_start`, before your code runs.
2. Your app instruments a store with `withDevtools()`. With the default `transport: "auto"` it sees
   the mark and talks `postMessage` instead of opening a WebSocket.
3. The Yoltra panel in DevTools mounts `@yoltra/devtools-storeview` over its own in-memory broker,
   and the service worker joins it to the page in the inspected tab.

A page with several stores works through the bridge as it does through a hub. Each store's socket
stamps its frames with its own connection id, and the panel gives each one its own connection to
the broker, so every store registers under its own `storeId` and receives only the commands that
name it. A second store presenting an id that is already connected is refused with the hub's
message, and a disposed store is announced as gone. The relays carry the connection id unread,
alongside the frame.

**Inside a DevTools panel, the extension always takes the bridge.** `panel.ts` chooses the hub only
when `chrome.devtools.inspectedWindow.tabId` is missing, which happens only when `panel.html` is
opened outside DevTools, for example as a plain extension page. So the popup's hub host and port
are not used by the DevTools panel, and a store whose agent talks to a hub (`transport:
"websocket"`, an explicit `socketFactory`, a page the content script does not run on, such as
`file://`, or a page whose Content-Security-Policy blocks that inline script) does not appear in
it. Inspect those with
[`@yoltra/devtools-cli`](../devtools-cli/README.md), or with `@yoltra/devtools-storeview` mounted
in a page of your own, both connected to the hub.

---

## Configuration

Click the extension popup icon to configure:

| Setting | Default     | Description                                          |
| ------- | ----------- | ---------------------------------------------------- |
| Host    | `localhost` | Hub server hostname                                  |
| Port    | `9800`      | Hub server port                                      |
| Token   | none        | The hub's token, if the hub was started with one     |

Settings are persisted in `chrome.storage.local`. The token is sent in the handshake; a hub
started with a token refuses a panel that does not present the same one.

---

## Architecture

| File                            | Responsibility                                      |
| ------------------------------- | --------------------------------------------------- |
| `manifest.json`                 | MV3 extension manifest (permissions, devtools page) |
| `devtools.html` / `devtools.ts` | Registers the DevTools panel                        |
| `panel.html` / `panel.ts`       | Mounts `@yoltra/devtools-storeview` in the panel    |
| `popup.html` / `popup.ts`       | Hub connection settings UI                          |
| `hub-config.ts`                 | Maps the saved settings to the hub connection       |
| `bridge.ts`                     | One broker connection per page socket               |
| `content-script.ts`             | Page ↔ extension relay; announces the bridge        |
| `background.ts`                 | Service worker joining a page to its panel by tab   |

---

## Prerequisites

The DevTools panel needs **no hub**: see [How It Works](#how-it-works). A hub matters only when
`panel.html` is opened outside DevTools, which then connects to a **running DevTools hub**. Start
one using any of:

```bash
# Standalone server
npx @yoltra/devtools-server --port 9800

# Embedded in the terminal UI
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
