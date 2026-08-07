[**@yoltra/core**](../README.md)

***

[@yoltra/core](../README.md) / PersistableStore

# Interface: PersistableStore

Defined in: [persistence/persist.ts:182](https://github.com/yoltra/yoltra/blob/main/packages/core/src/persistence/persist.ts#L182)

The store surface persistence needs, which is two methods wide.

## Methods

### getState()

> **getState**(): `unknown`

Defined in: [persistence/persist.ts:183](https://github.com/yoltra/yoltra/blob/main/packages/core/src/persistence/persist.ts#L183)

#### Returns

`unknown`

***

### instrument()

> **instrument**(`observer`): () => `void`

Defined in: [persistence/persist.ts:184](https://github.com/yoltra/yoltra/blob/main/packages/core/src/persistence/persist.ts#L184)

#### Parameters

##### observer

(`info`) => `void`

#### Returns

> (): `void`

##### Returns

`void`
