![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

[**@yoltra/core**](../README.md)

***

[@yoltra/core](../README.md) / dehydrate

# Function: dehydrate()

> **dehydrate**(`store`, `options`): `string`

Defined in: [persistence/persist.ts:271](https://github.com/yoltra/yoltra/blob/main/packages/core/src/persistence/persist.ts#L271)

Serializes a store for handoff, for example from a server render to the client.

## Parameters

### store

`Pick`\<[`PersistableStore`](../interfaces/PersistableStore.md), `"getState"`\>

### options

`Pick`\<[`PersistOptions`](../interfaces/PersistOptions.md), `"version"` \| `"slices"`\>

## Returns

`string`
