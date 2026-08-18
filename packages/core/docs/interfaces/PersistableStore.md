![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

[**@yoltra/core**](../README.md)

***

[@yoltra/core](../README.md) / PersistableStore

# Interface: PersistableStore

Defined in: [persistence/persist.ts:177](https://github.com/yoltra/yoltra/blob/main/packages/core/src/persistence/persist.ts#L177)

The store surface persistence needs, which is two methods wide.

## Methods

### getState()

> **getState**(): `unknown`

Defined in: [persistence/persist.ts:178](https://github.com/yoltra/yoltra/blob/main/packages/core/src/persistence/persist.ts#L178)

#### Returns

`unknown`

***

### instrument()

> **instrument**(`observer`): () => `void`

Defined in: [persistence/persist.ts:179](https://github.com/yoltra/yoltra/blob/main/packages/core/src/persistence/persist.ts#L179)

#### Parameters

##### observer

(`info`) => `void`

#### Returns

> (): `void`

##### Returns

`void`
