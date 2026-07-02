![Yoltra logo](../../assets/logo.svg)

# @yoltra/devtools-cli

> [ 🇲🇽 Versión en Español](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-cli/README.es.md)&nbsp;
> |
> &nbsp;[ 🇵🇹 Versão Portuguesa](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-cli/README.pt.md)&nbsp;
> | &nbsp; 👉
> [ 🇺🇸 English Version](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-cli/README.md)&nbsp;
> |
> &nbsp;[ 🇫🇷 Version française](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-cli/README.fr.md)

**Terminal UI for Yoltra DevTools — inspect stores from the command line.**

`@yoltra/devtools-cli` is a React + Ink terminal application that embeds a DevTools hub and
renders a full-featured TUI for inspecting Yoltra stores. Useful for debugging Node.js servers,
headless environments, and SSH sessions where a browser is not available.

---

## Installation

```bash
npm install -g @yoltra/devtools-cli
```

Or run directly:

```bash
npx @yoltra/devtools-cli
```

---

## Quick Start

```bash
# Start the CLI (auto-starts hub on port 9800)
npx @yoltra/devtools-cli

# Custom port and history size
npx @yoltra/devtools-cli --port 8900 --history-size 2000
```

Then instrument your store in another process:

```typescript
import { withNodetools } from "@yoltra/devtools-node-agent";

withNodetools(store, { port: 9800 });
```

The CLI will display connected stores and live event data.

---

## Features

- Embedded DevTools hub (auto-starts, skips if one is already running)
- Tabbed store selector for multiple connected stores
- Event timeline with channel/type display
- Interactive state tree explorer
- Subscriptions panel (reducers, effects, middleware)
- Performance metrics dashboard
- Event emitter for injecting test events
- Keyboard navigation with focus management

---

## Panels

| Panel         | Key | Description                                         |
| ------------- | --- | --------------------------------------------------- |
| Events        | `1` | Live event stream with channel, type, and timestamp |
| State         | `2` | Collapsible state tree with current values          |
| Subscriptions | `3` | Registered reducers, effects, middleware            |
| Metrics       | `4` | Event count, rate, processing time, queue depth     |
| Emit          | `5` | Compose and emit events to the selected store       |

---

## CLI Options

| Flag             | Default | Description                                     |
| ---------------- | ------- | ----------------------------------------------- |
| `--port`         | `9800`  | Hub server port                                 |
| `--history-size` | `1000`  | Max events retained for late-connecting clients |

---

## How It Works

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  Your App    │     │  CLI         │     │  Ink TUI     │
│  (with       │ WS  │  (embedded   │     │  (React +    │
│  withNodetools│────►│   hub)       │────►│   Ink)       │
│  )           │     │              │     │              │
└──────────────┘     └──────────────┘     └──────────────┘
```

1. The CLI starts an embedded `DevtoolsHub` (or detects an existing one via `probe()`)
2. The Ink TUI connects to the hub as an extension using `@yoltra/devtools-ui` hooks
3. Your app's store agent connects to the hub via WebSocket
4. Events, state, and commands flow through the hub in real time

---

## Architecture

| File                                | Responsibility                                   |
| ----------------------------------- | ------------------------------------------------ |
| `index.ts`                          | CLI entry point, argument parsing, hub lifecycle |
| `app.tsx`                           | Root Ink component with `HubProvider`            |
| `components/StoreTabs.tsx`          | Tabbed store selector                            |
| `components/EventTimeline.tsx`      | Terminal event log                               |
| `components/StateTree.tsx`          | Collapsible state tree                           |
| `components/SubscriptionsPanel.tsx` | Subscription inventory                           |
| `components/MetricsDashboard.tsx`   | Performance counters                             |
| `components/EventEmitter.tsx`       | Event composition form                           |
| `components/StatusBar.tsx`          | Connection status bar                            |
| `hooks/useKeyBindings.ts`           | Keyboard shortcut management                     |
| `hooks/useFocusManager.ts`          | Focus cycling between panels                     |

---

## Related Packages

- **[@yoltra/devtools-server](../devtools-server/README.md)** — The hub embedded by this CLI
- **[@yoltra/devtools-ui](../devtools-ui/README.md)** — React hooks powering the TUI logic
- **[@yoltra/devtools-protocol](../devtools-protocol/README.md)** — Wire format for hub
  communication
- **[@yoltra/devtools-node-agent](../devtools-node-agent/README.md)** — Agent for connecting
  Node.js stores
- **[@yoltra/devtools-browser-agent](../devtools-browser-agent/README.md)** — Agent for
  connecting browser stores
- **[@yoltra/devtools-vscode](../devtools-vscode/README.md)** — Alternative: VS Code integration
- **[@yoltra/devtools-ext](../devtools-ext/README.md)** — Alternative: Browser extension

---

## License

**MIT** — Free to use in commercial and open-source projects.
