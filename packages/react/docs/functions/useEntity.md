[**@yoltra/react**](../README.md)

***

[@yoltra/react](../README.md) / useEntity

# Function: useEntity()

> **useEntity**\<`T`, `Id`, `R`\>(`reducer`, `adapter`, `id`): `T` \| `undefined`

Defined in: [react/src/entity/useEntity.ts:46](https://github.com/yoltra/yoltra/blob/main/packages/react/src/entity/useEntity.ts#L46)

Subscribes to one entity.

## Type Parameters

### T

`T`

### Id

`Id` *extends* `EntityId`

### R

`R` *extends* `string`

## Parameters

### reducer

`R`

### adapter

`EntityAdapter`\<`T`, `Id`\>

### id

`Id`

## Returns

`T` \| `undefined`

The entity, or `undefined` once it has been removed — a row that outlives its data
for one render is normal, and returning `undefined` is what lets it render nothing rather
than throw.
