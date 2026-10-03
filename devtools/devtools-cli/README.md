![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

# @yoltra/devtools-cli

> [ 🇲🇽 Versión en Español](./README.es.md)&nbsp; | 👉 🇺🇸 English Version &nbsp;

[![npm version](https://img.shields.io/npm/v/@yoltra/devtools-cli)](https://www.npmjs.com/package/@yoltra/devtools-cli)
[![npm downloads](https://img.shields.io/npm/dm/@yoltra/devtools-cli)](https://www.npmjs.com/package/@yoltra/devtools-cli)
[![types](https://img.shields.io/npm/types/@yoltra/devtools-cli)](https://www.npmjs.com/package/@yoltra/devtools-cli)
[![License](https://img.shields.io/npm/l/@yoltra/devtools-cli)](https://github.com/yoltra/yoltra/blob/main/LICENSE)

**Terminal UI for Yoltra DevTools: inspect stores from the command line.**

`@yoltra/devtools-cli` is a React + Ink terminal application that embeds a DevTools hub and
renders a full-featured TUI for inspecting Yoltra stores. Useful when you would rather keep the
inspector in a terminal, or in an SSH session where a browser is not available.

> **Full documentation:** [@yoltra/devtools-cli on yoltra.dev](https://yoltra.dev/en/yoltra/packages/devtools-cli/)

## Installation

```bash
npm install -g @yoltra/devtools-cli
```

Or run it directly with `npx @yoltra/devtools-cli`.

## Quick Start

```bash
# Start the CLI (auto-starts hub on port 9800)
npx @yoltra/devtools-cli

# Custom port and history size
npx @yoltra/devtools-cli --port 8900 --history-size 2000
```

Then connect your app's store to that hub. `transport: "websocket"` sends it to the hub even when
the browser extension is installed:

```typescript
import { withDevtools } from "@yoltra/devtools-browser-agent";

withDevtools(store, { port: 9800, transport: "websocket" });
```

## Panels and features

The embedded hub starts only if none is running. A tabbed selector lists the connected stores,
and six panels show them: **Events** (live stream), **State** (collapsible tree), **Time Travel**
(for a store with `allowReplay`), **Subscriptions** (reducers, effects, middleware), **Metrics**
and **Emit** (compose test events). `Tab` and `Shift+Tab` move between panels, `]` and `[`
between stores, `←`, `→` and `r` step and resume time travel, and `q` quits. While an Emit field
has focus every key is typed into it; `Esc` leaves the form.

## CLI Options

| Flag             | Default | Description                                     |
| ---------------- | ------- | ----------------------------------------------- |
| `--port`         | `9800`  | Hub server port                                 |
| `--history-size` | `1000`  | Max events retained for late-connecting clients |
| `--token`        | none    | Token the hub requires of every client          |

`--token` can also come from the `YOLTRA_DEVTOOLS_TOKEN` environment variable, which keeps it out
of the process list; pass the same token to each store agent (`authToken`). `parseArgs`,
`CliArgs`, `CliArgsError` and the defaults are exported for tools that embed the hub.

## How It Works

The CLI is an optional hub and a panel in one process. It starts a `DevtoolsHub` only when
`DevtoolsHub.probe` finds nothing listening on the port, and the Ink UI always connects as a
regular extension through `HubProvider` from `@yoltra/devtools-ui`, so it behaves the same
against its own hub or one already running. The package page has the
[diagram and the source layout](https://yoltra.dev/en/yoltra/packages/devtools-cli/#architecture).

```mermaid
flowchart TD
    accTitle: How the CLI starts
    accDescr: The CLI parses its options, reuses a running hub or starts its own, and renders the panels in the terminal through the devtools-ui hooks
    run(["npx @yoltra/devtools-cli --port 9800 --history-size 1000"])
    agent(["your app's store agent<br/>withDevtools"])
    hubNode(["hub on 127.0.0.1:port"])

    subgraph cli ["@yoltra/devtools-cli"]
    direction TB
        args["parseArgs<br/>range-checked, CliArgsError exits with 2"]
        args --> probe{"DevtoolsHub.probe(port)<br/>a socket already listening?"}
        probe -->|"no"| start["DevtoolsHub.start<br/>embedded, stopped when the CLI exits"]
        probe -->|"yes"| reuse["reuse the running hub"]
        start --> render["Ink render(App)"]
        reuse --> render
        render --> provider["HubProvider<br/>extensionName CLI DevTools"]
        provider --> inner["AppInner<br/>devtools-ui hooks for the selected store"]
        keys["useKeyBindings and useFocusManager<br/>Tab and Shift+Tab: panel, brackets: store,<br/>arrows and r: time travel, q: quit"] --> inner
        inner --> tabs["Events, State, Time Travel,<br/>Subscriptions, Metrics, Emit"]
    end

    run --> args
    start -.->|"listens as"| hubNode
    reuse -.->|"uses"| hubNode
    agent <-->|"WebSocket"| hubNode
    hubNode <-->|"WebSocket"| provider
```

## Related Packages

- **[@yoltra/devtools-server](../devtools-server/README.md)**: the hub embedded by this CLI
- **[@yoltra/devtools-ui](../devtools-ui/README.md)**: React hooks powering the TUI logic
- **[@yoltra/devtools-protocol](../devtools-protocol/README.md)**: wire format for hub communication
- **[@yoltra/devtools-browser-agent](../devtools-browser-agent/README.md)**: agent for browser stores
- **[@yoltra/devtools-ext](../devtools-ext/README.md)**: the alternative, a browser extension

## License

**MIT**. Free to use in commercial and open-source projects.

> **Full documentation:** [@yoltra/devtools-cli on yoltra.dev](https://yoltra.dev/en/yoltra/packages/devtools-cli/)
