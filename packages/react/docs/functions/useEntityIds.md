[**@yoltra/react**](../README.md)

***

[@yoltra/react](../README.md) / useEntityIds

# Function: useEntityIds()

> **useEntityIds**\<`T`, `Id`, `R`\>(`reducer`, `adapter`): readonly `Id`[]

Defined in: [react/src/entity/useEntity.ts:27](https://github.com/yoltra/yoltra/blob/main/packages/react/src/entity/useEntity.ts#L27)

Subscribes to a collection's order.

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

## Returns

readonly `Id`[]

## Remarks

This is the subscription a list container wants, and the only one that should wake when the
collection is reordered. Rows use [useEntity](useEntity.md) or [useEntityField](useEntityField.md) and stay
asleep through a sort.
