![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

[**@yoltra/devtools-browser-agent**](../README.md)

***

[@yoltra/devtools-browser-agent](../README.md) / withDevtools

# Function: withDevtools()

> **withDevtools**\<`R`, `S`, `EM`\>(`store`, `config`): `StoreInstance`\<`R`, `S`, `EM`\>

Defined in: [withDevtools.ts:91](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-browser-agent/src/withDevtools.ts#L91)

Wraps a Yoltra store with DevTools instrumentation for browser environments.

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

- Connects to the DevTools hub via native `WebSocket`.
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
import { withDevtools } from '@yoltra/devtools-browser-agent';

const store = createStore({ name: 'App', reducer: { ... } });
withDevtools(store, { port: 9800 });
```
