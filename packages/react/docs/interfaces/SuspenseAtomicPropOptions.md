[**@yoltra/react**](../README.md)

***

[@yoltra/react](../README.md) / SuspenseAtomicPropOptions

# Interface: SuspenseAtomicPropOptions\<T, S\>

Defined in: [react/src/hooks/suspense.ts:120](https://github.com/yoltra/yoltra/blob/deb942c60b290a53939a9e286974c0da4e3f44ce/packages/react/src/hooks/suspense.ts#L120)

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

Defined in: [react/src/hooks/suspense.ts:131](https://github.com/yoltra/yoltra/blob/deb942c60b290a53939a9e286974c0da4e3f44ce/packages/react/src/hooks/suspense.ts#L131)

Optional extra key to differentiate cache entries for the same path.

***

### load()

> **load**: (`valueAtPath`, `slice`) => `T` \| `Promise`\<`T`\>

Defined in: [react/src/hooks/suspense.ts:122](https://github.com/yoltra/yoltra/blob/deb942c60b290a53939a9e286974c0da4e3f44ce/packages/react/src/hooks/suspense.ts#L122)

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

Defined in: [react/src/hooks/suspense.ts:129](https://github.com/yoltra/yoltra/blob/deb942c60b290a53939a9e286974c0da4e3f44ce/packages/react/src/hooks/suspense.ts#L129)

Extra wall-clock TTL (ms) for a resolved value. `0` (the default) or omitted
means the cached value is served until the subscribed path changes or you
invalidate it explicitly; a positive value additionally expires it after that
many ms. Cached errors ignore this and are re-thrown until invalidated.
