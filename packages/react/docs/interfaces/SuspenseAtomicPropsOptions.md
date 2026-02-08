[**@quojs/react**](../README.md)

***

[@quojs/react](../README.md) / SuspenseAtomicPropsOptions

# Interface: SuspenseAtomicPropsOptions\<T, S\>

Defined in: [react/src/hooks/suspense.ts:183](https://github.com/quojs/quojs/blob/90b047cd5df060b28c5f76a1ad4792631061e571/packages/react/src/hooks/suspense.ts#L183)

Options for [useSuspenseAtomicProps](../functions/useSuspenseAtomicProps.md).

## Type Parameters

### T

`T`

### S

`S`

## Properties

### key?

> `optional` **key**: `string`

Defined in: [react/src/hooks/suspense.ts:186](https://github.com/quojs/quojs/blob/90b047cd5df060b28c5f76a1ad4792631061e571/packages/react/src/hooks/suspense.ts#L186)

***

### load()

> **load**: (`state`) => `T` \| `Promise`\<`T`\>

Defined in: [react/src/hooks/suspense.ts:184](https://github.com/quojs/quojs/blob/90b047cd5df060b28c5f76a1ad4792631061e571/packages/react/src/hooks/suspense.ts#L184)

#### Parameters

##### state

`S`

#### Returns

`T` \| `Promise`\<`T`\>

***

### staleTime?

> `optional` **staleTime**: `number`

Defined in: [react/src/hooks/suspense.ts:185](https://github.com/quojs/quojs/blob/90b047cd5df060b28c5f76a1ad4792631061e571/packages/react/src/hooks/suspense.ts#L185)
