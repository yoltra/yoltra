[**@yoltra/core**](../README.md)

***

[@yoltra/core](../README.md) / EntityState

# Interface: EntityState\<T, Id\>

Defined in: [entity/entityAdapter.ts:38](https://github.com/yoltra/yoltra/blob/main/packages/core/src/entity/entityAdapter.ts#L38)

A normalised collection.

## Type Parameters

### T

`T`

The entity.

### Id

`Id` *extends* [`EntityId`](../type-aliases/EntityId.md) = `string`

Its key type.

## Properties

### entities

> `readonly` **entities**: `Readonly`\<`Record`\<`Id`, `T`\>\>

Defined in: [entity/entityAdapter.ts:42](https://github.com/yoltra/yoltra/blob/main/packages/core/src/entity/entityAdapter.ts#L42)

Identity-keyed, so a path to one entity survives every change to the others.

***

### ids

> `readonly` **ids**: readonly `Id`[]

Defined in: [entity/entityAdapter.ts:40](https://github.com/yoltra/yoltra/blob/main/packages/core/src/entity/entityAdapter.ts#L40)

Order. Reordering touches this and nothing under `entities`.
