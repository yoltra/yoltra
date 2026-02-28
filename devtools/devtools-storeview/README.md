![Yoltra logo](../../assets/logo.svg)

# @yoltra/devtools-storeview

> [ 🇲🇽 Versión en Español](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-storeview/README.es.md)&nbsp;
> | 👉
> [ 🇺🇸 English Version](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-storeview/README.md)&nbsp;

**React DOM UI for Yoltra DevTools — the visual store inspector.**

`@yoltra/devtools-storeview` provides a full-featured React application for inspecting Yoltra
stores in real time. It renders event timelines, state trees, subscription graphs, performance
metrics, time-travel controls, and an event emitter. Used by both the browser extension panel..

---

## Installation

```bash
npm install @yoltra/devtools-storeview
```

**Peer dependencies:** `react` ^18, `react-dom` ^18

---

## Quick Start

### Mount into a DOM element

```typescript
import { mountDevtools } from "@yoltra/devtools-storeview";

const container = document.getElementById("root")!;

const unmount = mountDevtools(container, {
  port: 9800,
  extensionName: "My DevTools",
  autoReconnect: true,
});

// Later...
unmount();
```

### Use as a React component

```tsx
import { DevtoolsApp } from "@yoltra/devtools-storeview";

function MyPanel() {
  return <DevtoolsApp config={{ port: 9800, extensionName: "My Panel" }} />;
}
```

---

## Panels

The app provides six tabs, each backed by hooks from `@yoltra/devtools-ui`:

| Panel             | Description                                                                           |
| ----------------- | ------------------------------------------------------------------------------------- |
| **Events**        | Scrollable event timeline with filtering by channel/type and committed/bounced status |
| **State**         | Interactive JSON tree explorer with live state updates and manual refresh             |
| **Subscriptions** | Inventory of registered reducers, effects, middleware, and active subscriptions       |
| **Time Travel**   | Step through event history, jump to any index, resume live mode                       |
| **Emit**          | Compose and emit synthetic events to the selected store                               |
| **Metrics**       | Real-time dashboard of event rate, processing time, queue depth, and more             |

---

## Layout

```
┌─────────────────────────────────────────────┐
│  TopBar  (store selector + connection dot)  │
├─────────────────────────────────────────────┤
│  TabBar  (Events | State | Subscriptions…)  │
├─────────────────────────────────────────────┤
│                                             │
│            Active Panel Content             │
│                                             │
├─────────────────────────────────────────────┤
│  BottomBar  (connection status)             │
└─────────────────────────────────────────────┘
```

---

## Exported Components

### Mount API

| Export                             | Description                                                |
| ---------------------------------- | ---------------------------------------------------------- |
| `mountDevtools(container, config)` | Mount the full app into a DOM element, returns `unmount()` |
| `DevtoolsApp`                      | Root React component with `HubProvider` included           |

### Layout

| Export      | Description                                       |
| ----------- | ------------------------------------------------- |
| `TopBar`    | Store selector dropdown with connection indicator |
| `BottomBar` | Connection status bar                             |

### Panels

| Export               | Description                                    |
| -------------------- | ---------------------------------------------- |
| `EventTimeline`      | Event log with filtering and detail inspection |
| `StateTreeExplorer`  | Collapsible JSON state tree with refresh       |
| `SubscriptionsPanel` | Reducer/effect/middleware/subscription tables  |
| `TimeTravelPanel`    | Event history scrubber with step/jump/resume   |
| `EventEmitterPanel`  | Form for composing and emitting events         |
| `MetricsDashboard`   | Performance counters and real-time stats       |

### Shared

| Export          | Description                     |
| --------------- | ------------------------------- |
| `JsonTree`      | Recursive JSON tree renderer    |
| `FilterBar`     | Text and toggle filter controls |
| `ConnectionDot` | Colored status indicator        |

---

## Theming

The app uses CSS Modules with CSS custom properties. A VSCode-compatible theme is provided at
`styles/vscode-theme.css` for embedding in webview panels.

---

## Related Packages

- **[@yoltra/devtools-ui](../devtools-ui/README.md)** — Hooks and logic this UI is built on
- **[@yoltra/devtools-protocol](../devtools-protocol/README.md)** — Wire format and message
  types
- **[@yoltra/devtools-ext](../devtools-ext/README.md)** — Browser extension that mounts this app

---

## License

**MIT** — Free to use in commercial and open-source projects.
