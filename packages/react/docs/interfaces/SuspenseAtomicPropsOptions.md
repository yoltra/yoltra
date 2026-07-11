[**@yoltra/react**](../README.md)

***

[@yoltra/react](../README.md) / SuspenseAtomicPropsOptions

# Interface: SuspenseAtomicPropsOptions\<T, S\>

Defined in: [react/src/hooks/suspense.ts:253](https://github.com/yoltra/yoltra/blob/deb942c60b290a53939a9e286974c0da4e3f44ce/packages/react/src/hooks/suspense.ts#L253)

Options for [useSuspenseAtomicProps](../functions/useSuspenseAtomicProps.md).

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

Defined in: [react/src/hooks/suspense.ts:264](https://github.com/yoltra/yoltra/blob/deb942c60b290a53939a9e286974c0da4e3f44ce/packages/react/src/hooks/suspense.ts#L264)

Optional extra key to differentiate cache entries.

***

### load()

> **load**: (`state`) => `T` \| `Promise`\<`T`\>

Defined in: [react/src/hooks/suspense.ts:255](https://github.com/yoltra/yoltra/blob/deb942c60b290a53939a9e286974c0da4e3f44ce/packages/react/src/hooks/suspense.ts#L255)

Async loader that receives the full store state.

#### Parameters

##### state

`S`

#### Returns

`T` \| `Promise`\<`T`\>

***

### staleTime?

> `optional` **staleTime**: `number`

Defined in: [react/src/hooks/suspense.ts:262](https://github.com/yoltra/yoltra/blob/deb942c60b290a53939a9e286974c0da4e3f44ce/packages/react/src/hooks/suspense.ts#L262)

Extra wall-clock TTL (ms) for a resolved value. `0` (the default) or omitted
means the cached value is served until the subscribed path changes or you
invalidate it explicitly; a positive value additionally expires it after that
many ms. Cached errors ignore this and are re-thrown until invalidated.
