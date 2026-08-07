![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

[**@yoltra/core**](../README.md)

***

[@yoltra/core](../README.md) / EntityAdapterOptions

# Interface: EntityAdapterOptions\<T, Id\>

Defined in: [entity/entityAdapter.ts:52](https://github.com/yoltra/yoltra/blob/main/packages/core/src/entity/entityAdapter.ts#L52)

How an adapter identifies and orders its entities.

## Type Parameters

### T

`T`

### Id

`Id` *extends* [`EntityId`](../type-aliases/EntityId.md)

## Properties

### selectId()?

> `readonly` `optional` **selectId**: (`entity`) => `Id`

Defined in: [entity/entityAdapter.ts:54](https://github.com/yoltra/yoltra/blob/main/packages/core/src/entity/entityAdapter.ts#L54)

Defaults to reading `id`.

#### Parameters

##### entity

`T`

#### Returns

`Id`

***

### sortComparer()?

> `readonly` `optional` **sortComparer**: (`a`, `b`) => `number`

Defined in: [entity/entityAdapter.ts:63](https://github.com/yoltra/yoltra/blob/main/packages/core/src/entity/entityAdapter.ts#L63)

Keeps `ids` sorted.

#### Parameters

##### a

`T`

##### b

`T`

#### Returns

`number`

#### Remarks

Omit it and `ids` holds insertion order, which is cheaper: with a comparer, any change
that could affect position re-sorts. The sorted array is only adopted when it actually
differs, so a sort that changes nothing reports nothing.
