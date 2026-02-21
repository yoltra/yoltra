[**@yoltra/react**](../README.md)

***

[@yoltra/react](../README.md) / SuspenseAtomicPropsOptions

# Interface: SuspenseAtomicPropsOptions\<T, S\>

Defined in: [react/src/hooks/suspense.ts:217](https://github.com/yoltra/yoltra/blob/7bf784f9e7daaf114608ff30306ac3400da926ed/packages/react/src/hooks/suspense.ts#L217)

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

Defined in: [react/src/hooks/suspense.ts:223](https://github.com/yoltra/yoltra/blob/7bf784f9e7daaf114608ff30306ac3400da926ed/packages/react/src/hooks/suspense.ts#L223)

Optional extra key to differentiate cache entries.

***

### load()

> **load**: (`state`) => `T` \| `Promise`\<`T`\>

Defined in: [react/src/hooks/suspense.ts:219](https://github.com/yoltra/yoltra/blob/7bf784f9e7daaf114608ff30306ac3400da926ed/packages/react/src/hooks/suspense.ts#L219)

Async loader that receives the full store state.

#### Parameters

##### state

`S`

#### Returns

`T` \| `Promise`\<`T`\>

***

### staleTime?

> `optional` **staleTime**: `number`

Defined in: [react/src/hooks/suspense.ts:221](https://github.com/yoltra/yoltra/blob/7bf784f9e7daaf114608ff30306ac3400da926ed/packages/react/src/hooks/suspense.ts#L221)

Time in ms before the cached value is considered stale (default: 0).
