[**@quojs/react**](../README.md)

***

[@quojs/react](../README.md) / SuspenseAtomicPropsOptions

# Interface: SuspenseAtomicPropsOptions\<T, S\>

Defined in: [hooks/suspense.ts:183](https://github.com/quojs/quojs/blob/d7e7368223439ffec372ae1e5232d6f03b0a0e1f/packages/react/src/hooks/suspense.ts#L183)

Options for [useSuspenseAtomicProps](../functions/useSuspenseAtomicProps.md).

## Type Parameters

### T

`T`

### S

`S`

## Properties

### key?

> `optional` **key**: `string`

Defined in: [hooks/suspense.ts:186](https://github.com/quojs/quojs/blob/d7e7368223439ffec372ae1e5232d6f03b0a0e1f/packages/react/src/hooks/suspense.ts#L186)

***

### load()

> **load**: (`state`) => `T` \| `Promise`\<`T`\>

Defined in: [hooks/suspense.ts:184](https://github.com/quojs/quojs/blob/d7e7368223439ffec372ae1e5232d6f03b0a0e1f/packages/react/src/hooks/suspense.ts#L184)

#### Parameters

##### state

`S`

#### Returns

`T` \| `Promise`\<`T`\>

***

### staleTime?

> `optional` **staleTime**: `number`

Defined in: [hooks/suspense.ts:185](https://github.com/quojs/quojs/blob/d7e7368223439ffec372ae1e5232d6f03b0a0e1f/packages/react/src/hooks/suspense.ts#L185)
