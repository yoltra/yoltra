![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

[**@yoltra/core**](../README.md)

***

[@yoltra/core](../README.md) / PersistableStore

# Interface: PersistableStore

Defined in: [persistence/persist.ts:238](https://github.com/yoltra/yoltra/blob/main/packages/core/src/persistence/persist.ts#L238)

The store surface persistence needs, which is two methods wide.

## Methods

### getState()

> **getState**(): `unknown`

Defined in: [persistence/persist.ts:239](https://github.com/yoltra/yoltra/blob/main/packages/core/src/persistence/persist.ts#L239)

#### Returns

`unknown`

***

### instrument()

> **instrument**(`observer`): () => `void`

Defined in: [persistence/persist.ts:240](https://github.com/yoltra/yoltra/blob/main/packages/core/src/persistence/persist.ts#L240)

#### Parameters

##### observer

(`info`) => `void`

#### Returns

> (): `void`

##### Returns

`void`
