[**@quojs/react**](../README.md)

***

[@quojs/react](../README.md) / SuspenseAtomicPropOptions

# Interface: SuspenseAtomicPropOptions\<T, S\>

Defined in: [react/src/hooks/suspense.ts:119](https://github.com/quojs/quojs/blob/90b047cd5df060b28c5f76a1ad4792631061e571/packages/react/src/hooks/suspense.ts#L119)

Options for [useSuspenseAtomicProp](../functions/useSuspenseAtomicProp.md).

## Type Parameters

### T

`T`

### S

`S`

## Properties

### key?

> `optional` **key**: `string`

Defined in: [react/src/hooks/suspense.ts:122](https://github.com/quojs/quojs/blob/90b047cd5df060b28c5f76a1ad4792631061e571/packages/react/src/hooks/suspense.ts#L122)

***

### load()

> **load**: (`valueAtPath`, `slice`) => `T` \| `Promise`\<`T`\>

Defined in: [react/src/hooks/suspense.ts:120](https://github.com/quojs/quojs/blob/90b047cd5df060b28c5f76a1ad4792631061e571/packages/react/src/hooks/suspense.ts#L120)

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

Defined in: [react/src/hooks/suspense.ts:121](https://github.com/quojs/quojs/blob/90b047cd5df060b28c5f76a1ad4792631061e571/packages/react/src/hooks/suspense.ts#L121)
