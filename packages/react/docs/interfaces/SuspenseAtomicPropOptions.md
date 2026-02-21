[**@yoltra/react**](../README.md)

***

[@yoltra/react](../README.md) / SuspenseAtomicPropOptions

# Interface: SuspenseAtomicPropOptions\<T, S\>

Defined in: [react/src/hooks/suspense.ts:113](https://github.com/yoltra/yoltra/blob/7bf784f9e7daaf114608ff30306ac3400da926ed/packages/react/src/hooks/suspense.ts#L113)

Options for [useSuspenseAtomicProp](../functions/useSuspenseAtomicProp.md).

## Example

```ts
const options: SuspenseAtomicPropOptions<User, AppState> = {
  load: async (userId) => fetchUser(userId),
  staleTime: 30_000, // cache for 30 seconds
  key: 'user-detail',
};
```

## Type Parameters

### T

`T`

The resolved value type after loading.

### S

`S`

Store state record.

## Properties

### key?

> `optional` **key**: `string`

Defined in: [react/src/hooks/suspense.ts:119](https://github.com/yoltra/yoltra/blob/7bf784f9e7daaf114608ff30306ac3400da926ed/packages/react/src/hooks/suspense.ts#L119)

Optional extra key to differentiate cache entries for the same path.

***

### load()

> **load**: (`valueAtPath`, `slice`) => `T` \| `Promise`\<`T`\>

Defined in: [react/src/hooks/suspense.ts:115](https://github.com/yoltra/yoltra/blob/7bf784f9e7daaf114608ff30306ac3400da926ed/packages/react/src/hooks/suspense.ts#L115)

Async loader that receives the value at the path and the full slice.

#### Parameters

##### valueAtPath

`any`

##### slice

`S`\[keyof `S`\]

#### Returns

`T` \| `Promise`\<`T`\>

***

### staleTime?

> `optional` **staleTime**: `number`

Defined in: [react/src/hooks/suspense.ts:117](https://github.com/yoltra/yoltra/blob/7bf784f9e7daaf114608ff30306ac3400da926ed/packages/react/src/hooks/suspense.ts#L117)

Time in ms before the cached value is considered stale (default: 0).
