![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

[**@yoltra/devtools-node-agent**](../README.md)

***

[@yoltra/devtools-node-agent](../README.md) / withNodetools

# Function: withNodetools()

> **withNodetools**\<`R`, `S`, `EM`\>(`store`, `config`): `StoreInstance`\<`R`, `S`, `EM`\>

Defined in: [withNodetools.ts:64](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-node-agent/src/withNodetools.ts#L64)

Wraps a Yoltra store with DevTools instrumentation for Node.js environments.

## Type Parameters

### R

`R` *extends* `string`

Reducer name union.

### S

`S` *extends* `Record`\<`R`, `any`\>

State record.

### EM

`EM` *extends* `EventMapBase`

Event map.

## Parameters

### store

`StoreInstance`\<`R`, `S`, `EM`\>

The store to instrument.

### config

[`DevtoolsWrapperConfig`](../interfaces/DevtoolsWrapperConfig.md)

DevTools wrapper configuration.

## Returns

`StoreInstance`\<`R`, `S`, `EM`\>

The same store instance, now instrumented.

## Remarks

- Connects to the DevTools hub via WebSocket (using the `ws` package).
- Observes every event via the typed `store.instrument()` seam — no
  `as any` bridging, no re-diffing, no full-state clone per event.
- Builds precise RFC 6902 patches from the exact changed leaf paths the core
  reports, and sends a `STORE_EVENT` per event (committed or vetoed).
- Handles incoming commands: REQUEST_STATE, REQUEST_METRICS,
  REQUEST_SUBSCRIPTIONS, TIME_TRAVEL, EVENT_REPLAY, EMIT_TO_STORE.
- Returns the **same** store instance (transparent instrumentation).
- Auto-reconnects to the hub on disconnect.

## Example

```ts
import { createStore } from '@yoltra/core';
import { withNodetools } from '@yoltra/devtools-node-agent';

const store = createStore({ name: 'App', reducer: { ... } });
withNodetools(store, { port: 9800 });
```
