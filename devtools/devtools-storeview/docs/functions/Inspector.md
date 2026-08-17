![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

[**@yoltra/devtools-storeview**](../README.md)

***

[@yoltra/devtools-storeview](../README.md) / Inspector

# Function: Inspector()

> **Inspector**(`__namedParameters`): `Element`

Defined in: [devtools-storeview/src/components/panels/Inspector.tsx:30](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-storeview/src/components/panels/Inspector.tsx#L30)

The Inspector — the primary DevTools view.

A scrollable, filterable event timeline paired with a detail pane for the
selected event. The detail pane foregrounds Yoltra's fine-grained story:
the exact **changed leaf paths** (from the event's RFC-6902 patches) and
their new values, plus the triggering payload. Middleware-vetoed events are
shown as such, with no state change.

When the selected store allows it, an **Emit** action reveals an inline
composer for dispatching ad-hoc events.

## Parameters

### \_\_namedParameters

#### canEmit?

`boolean` = `false`

#### entries

`EventLogEntry`[]

#### onEmit?

(`channel`, `type`, `payload`) => `void`

## Returns

`Element`
