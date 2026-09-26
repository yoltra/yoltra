![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

[**@yoltra/core**](../README.md)

***

[@yoltra/core](../README.md) / PersistableStore

# Interface: PersistableStore

Defined in: [persistence/persist.ts:181](https://github.com/yoltra/yoltra/blob/main/packages/core/src/persistence/persist.ts#L181)

The store surface persistence needs, which is two methods wide.

## Methods

### getState()

> **getState**(): `unknown`

Defined in: [persistence/persist.ts:182](https://github.com/yoltra/yoltra/blob/main/packages/core/src/persistence/persist.ts#L182)

#### Returns

`unknown`

***

### instrument()

> **instrument**(`observer`): () => `void`

Defined in: [persistence/persist.ts:183](https://github.com/yoltra/yoltra/blob/main/packages/core/src/persistence/persist.ts#L183)

#### Parameters

##### observer

(`info`) => `void`

#### Returns

> (): `void`

##### Returns

`void`
