![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

[**@yoltra/core**](../README.md)

***

[@yoltra/core](../README.md) / dehydrate

# Function: dehydrate()

> **dehydrate**(`store`, `options`): `string`

Defined in: [persistence/persist.ts:365](https://github.com/yoltra/yoltra/blob/main/packages/core/src/persistence/persist.ts#L365)

Serializes a store for handoff, for example from a server render to the client.

## Parameters

### store

`Pick`\<[`PersistableStore`](../interfaces/PersistableStore.md), `"getState"`\>

### options

`Pick`\<[`PersistOptions`](../interfaces/PersistOptions.md), `"version"` \| `"slices"` \| `"onError"` \| `"maxNodes"`\>

## Returns

`string`

The payload, or `""` when the state exceeded [PersistOptions.maxNodes](../interfaces/PersistOptions.md#maxnodes). An empty
  handoff hydrates as "nothing to restore", so the client starts from its defaults rather than
  from part of the server's state. The loss is reported through `onError` either way.
