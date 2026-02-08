[**@quojs/react**](../README.md)

***

[@quojs/react](../README.md) / shallowEqual

# Function: shallowEqual()

> **shallowEqual**\<`T`\>(`a`, `b`): `boolean`

Defined in: [react/src/hooks/hooks.ts:119](https://github.com/quojs/quojs/blob/90b047cd5df060b28c5f76a1ad4792631061e571/packages/react/src/hooks/hooks.ts#L119)

Shallow object equality using `Object.is` per-key.

## Type Parameters

### T

`T` *extends* `Record`\<`string`, `any`\>

## Parameters

### a

`T`

### b

`T`

## Returns

`boolean`

## Example

```ts
shallowEqual({ a: 1 }, { a: 1 }) // true
shallowEqual({ a: 1 }, { a: 2 }) // false
```
