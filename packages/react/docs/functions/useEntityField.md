[**@yoltra/react**](../README.md)

***

[@yoltra/react](../README.md) / useEntityField

# Function: useEntityField()

> **useEntityField**\<`T`, `Id`, `R`, `K`\>(`reducer`, `adapter`, `id`, `field`): `T`\[`K`\] \| `undefined`

Defined in: [react/src/entity/useEntity.ts:66](https://github.com/yoltra/yoltra/blob/main/packages/react/src/entity/useEntity.ts#L66)

Subscribes to one field of one entity.

## Type Parameters

### T

`T`

### Id

`Id` *extends* `EntityId`

### R

`R` *extends* `string`

### K

`K` *extends* `string`

## Parameters

### reducer

`R`

### adapter

`EntityAdapter`\<`T`, `Id`\>

### id

`Id`

### field

`K`

## Returns

`T`\[`K`\] \| `undefined`

## Remarks

The narrowest subscription available, and the reason the shape is worth adopting: editing a
title wakes the components reading that title and nothing else.
