![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

[**@yoltra/react**](../README.md)

***

[@yoltra/react](../README.md) / SuspenseAtomicPropsOptions

# Interface: SuspenseAtomicPropsOptions\<T, S\>

Defined in: [react/src/hooks/suspense.ts:487](https://github.com/yoltra/yoltra/blob/main/packages/react/src/hooks/suspense.ts#L487)

Options for `useSuspenseAtomicProps`.

## Type Parameters

### T

`T`

The resolved value type after loading.

### S

`S`

Store state record.

## Properties

### errorTtlMs?

> `optional` **errorTtlMs**: `null` \| `number`

Defined in: [react/src/hooks/suspense.ts:509](https://github.com/yoltra/yoltra/blob/main/packages/react/src/hooks/suspense.ts#L509)

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

Defined in: [react/src/hooks/suspense.ts:511](https://github.com/yoltra/yoltra/blob/main/packages/react/src/hooks/suspense.ts#L511)

Optional extra key to differentiate cache entries.

***

### load()

> **load**: (`state`) => `T` \| `Promise`\<`T`\>

Defined in: [react/src/hooks/suspense.ts:489](https://github.com/yoltra/yoltra/blob/main/packages/react/src/hooks/suspense.ts#L489)

Async loader that receives the full store state.

#### Parameters

##### state

`S`

#### Returns

`T` \| `Promise`\<`T`\>

***

### staleTime?

> `optional` **staleTime**: `number`

Defined in: [react/src/hooks/suspense.ts:496](https://github.com/yoltra/yoltra/blob/main/packages/react/src/hooks/suspense.ts#L496)

Extra wall-clock TTL (ms) for a resolved value. `0` (the default) or omitted
means the cached value is served until the subscribed path changes or you
invalidate it explicitly; a positive value additionally expires it after that
many ms. Cached errors ignore this and are re-thrown until invalidated.
