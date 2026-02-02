[**@quojs/react**](../README.md)

***

[@quojs/react](../README.md) / shallowEqual

# Function: shallowEqual()

> **shallowEqual**\<`T`\>(`a`, `b`): `boolean`

Defined in: [hooks/hooks.ts:141](https://github.com/quojs/quojs/blob/d7e7368223439ffec372ae1e5232d6f03b0a0e1f/packages/react/src/hooks/hooks.ts#L141)

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
