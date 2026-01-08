[**@quojs/react**](../README.md)

***

[@quojs/react](../README.md) / SuspenseAtomicPropOptions

# Interface: SuspenseAtomicPropOptions\<T, S\>

Defined in: [hooks/suspense.ts:119](https://github.com/quojs/quojs/blob/8b1c0adc6b9ff8a764bce1cedbec68a1d02e95ee/packages/react/src/hooks/suspense.ts#L119)

Options for [useSuspenseAtomicProp](../functions/useSuspenseAtomicProp.md).

## Type Parameters

### T

`T`

### S

`S`

## Properties

### key?

> `optional` **key**: `string`

Defined in: [hooks/suspense.ts:122](https://github.com/quojs/quojs/blob/8b1c0adc6b9ff8a764bce1cedbec68a1d02e95ee/packages/react/src/hooks/suspense.ts#L122)

***

### load()

> **load**: (`valueAtPath`, `slice`) => `T` \| `Promise`\<`T`\>

Defined in: [hooks/suspense.ts:120](https://github.com/quojs/quojs/blob/8b1c0adc6b9ff8a764bce1cedbec68a1d02e95ee/packages/react/src/hooks/suspense.ts#L120)

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

Defined in: [hooks/suspense.ts:121](https://github.com/quojs/quojs/blob/8b1c0adc6b9ff8a764bce1cedbec68a1d02e95ee/packages/react/src/hooks/suspense.ts#L121)
