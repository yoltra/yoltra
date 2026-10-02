![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

[**@yoltra/core**](../README.md)

***

[@yoltra/core](../README.md) / PersistableStore

# Interface: PersistableStore

Defined in: [persistence/persist.ts:191](https://github.com/yoltra/yoltra/blob/main/packages/core/src/persistence/persist.ts#L191)

The store surface persistence needs, which is two methods wide.

## Methods

### getState()

> **getState**(): `unknown`

Defined in: [persistence/persist.ts:192](https://github.com/yoltra/yoltra/blob/main/packages/core/src/persistence/persist.ts#L192)

#### Returns

`unknown`

***

### instrument()

> **instrument**(`observer`): () => `void`

Defined in: [persistence/persist.ts:193](https://github.com/yoltra/yoltra/blob/main/packages/core/src/persistence/persist.ts#L193)

#### Parameters

##### observer

(`info`) => `void`

#### Returns

> (): `void`

##### Returns

`void`
