[**@quojs/core**](../README.md)

***

[@quojs/core](../README.md) / Change

# Interface: Change\<V\>

Defined in: [types.ts:26](https://github.com/quojs/quojs/blob/67acf22c99f7bb5bc1300e174ce891cc1abf66aa/packages/core/src/types.ts#L26)

Generic “old > new” wrapper (now carries the dotted `path` that changed)

## Type Parameters

### V

`V` = `any`

## Properties

### newValue

> **newValue**: `V`

Defined in: [types.ts:28](https://github.com/quojs/quojs/blob/67acf22c99f7bb5bc1300e174ce891cc1abf66aa/packages/core/src/types.ts#L28)

***

### oldValue

> **oldValue**: `V`

Defined in: [types.ts:27](https://github.com/quojs/quojs/blob/67acf22c99f7bb5bc1300e174ce891cc1abf66aa/packages/core/src/types.ts#L27)

***

### path?

> `optional` **path**: `string`

Defined in: [types.ts:30](https://github.com/quojs/quojs/blob/67acf22c99f7bb5bc1300e174ce891cc1abf66aa/packages/core/src/types.ts#L30)

dotted path for fine-grained listeners; top-level emits like "data"
