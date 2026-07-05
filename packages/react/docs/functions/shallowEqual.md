[**@yoltra/react**](../README.md)

***

[@yoltra/react](../README.md) / shallowEqual

# Function: shallowEqual()

> **shallowEqual**\<`T`\>(`a`, `b`): `boolean`

Defined in: [react/src/utils/shallowEqual.ts:20](https://github.com/yoltra/yoltra/blob/ae94dea5790844eac37ee002f0fbed302029371e/packages/react/src/utils/shallowEqual.ts#L20)

Shallow object equality using `Object.is` per-key.

Useful as the `isEqual` argument for `useAtomicProp` and `useAtomicProps`
when the derived value is a plain object. Also available from the object
returned by [createHooks](createHooks.md) and [createYoltra](createYoltra.md).

## Type Parameters

### T

`T` *extends* `Record`\<`string`, `unknown`\>

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
