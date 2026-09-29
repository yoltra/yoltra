![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

[**@yoltra/ds**](../../README.md)

***

[@yoltra/ds](../../README.md) / [client](../README.md) / ControllableStateOptions

# Interface: ControllableStateOptions\<T\>

Defined in: [hooks/useControllableState.ts:5](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/hooks/useControllableState.ts#L5)

## Type Parameters

### T

`T`

## Properties

### defaultValue

> **defaultValue**: `T`

Defined in: [hooks/useControllableState.ts:9](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/hooks/useControllableState.ts#L9)

The starting value when uncontrolled.

***

### onChange()?

> `optional` **onChange**: (`next`) => `void`

Defined in: [hooks/useControllableState.ts:11](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/hooks/useControllableState.ts#L11)

Called on every change, controlled or not.

#### Parameters

##### next

`T`

#### Returns

`void`

***

### value?

> `optional` **value**: `T`

Defined in: [hooks/useControllableState.ts:7](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/hooks/useControllableState.ts#L7)

The controlled value. Passing it makes the caller the owner.
