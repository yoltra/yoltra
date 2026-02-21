[**@yoltra/react**](../README.md)

***

[@yoltra/react](../README.md) / shallowEqual

# Function: shallowEqual()

> **shallowEqual**\<`T`\>(`a`, `b`): `boolean`

Defined in: [react/src/hooks/hooks.ts:104](https://github.com/yoltra/yoltra/blob/a987f4d35946c58f44d8b45d3fefadd911124683/packages/react/src/hooks/hooks.ts#L104)

Shallow object equality using `Object.is` per-key.

Useful as the `isEqual` argument for `useAtomicProp` and `useAtomicProps`
when the derived value is a plain object. Also available from the object
returned by [createHooks](createHooks.md).

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
shallowEqual({ a: 1 }, { a: 1 }); // true
shallowEqual({ a: 1 }, { a: 2 }); // false
```
