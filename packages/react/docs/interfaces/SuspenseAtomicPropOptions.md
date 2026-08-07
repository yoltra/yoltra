[**@yoltra/react**](../README.md)

***

[@yoltra/react](../README.md) / SuspenseAtomicPropOptions

# Interface: SuspenseAtomicPropOptions\<T, S\>

Defined in: [react/src/hooks/suspense.ts:321](https://github.com/yoltra/yoltra/blob/main/packages/react/src/hooks/suspense.ts#L321)

Options for useSuspenseAtomicProp.

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

### errorTtlMs?

> `optional` **errorTtlMs**: `number` \| `null`

Defined in: [react/src/hooks/suspense.ts:343](https://github.com/yoltra/yoltra/blob/main/packages/react/src/hooks/suspense.ts#L343)

How long a **failed** load is remembered, in milliseconds.

#### Remarks

`0` or omitted — the default — delivers the error to the nearest boundary and then forgets
it, so resetting that boundary retries the load. Held errors made a retry button unable to
retry, which turned a transient failure into a permanent one.

A positive value puts a floor between attempts, for a loader that fails fast and would
otherwise be re-attempted on every reset. `null` holds the failure until something calls
`invalidate`, which is the old behaviour and is now something you ask for.

***

### key?

> `optional` **key**: `string`

Defined in: [react/src/hooks/suspense.ts:345](https://github.com/yoltra/yoltra/blob/main/packages/react/src/hooks/suspense.ts#L345)

Optional extra key to differentiate cache entries for the same path.

***

### load()

> **load**: (`valueAtPath`, `slice`) => `T` \| `Promise`\<`T`\>

Defined in: [react/src/hooks/suspense.ts:323](https://github.com/yoltra/yoltra/blob/main/packages/react/src/hooks/suspense.ts#L323)

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

Defined in: [react/src/hooks/suspense.ts:330](https://github.com/yoltra/yoltra/blob/main/packages/react/src/hooks/suspense.ts#L330)

Extra wall-clock TTL (ms) for a resolved value. `0` (the default) or omitted
means the cached value is served until the subscribed path changes or you
invalidate it explicitly; a positive value additionally expires it after that
many ms. Cached errors ignore this and are re-thrown until invalidated.
