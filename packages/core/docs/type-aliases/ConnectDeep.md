[**@quojs/core**](../README.md)

***

[@quojs/core](../README.md) / ConnectDeep

# Type Alias: ConnectDeep\<R, S\>

> **ConnectDeep**\<`R`, `S`\> = `object`

Defined in: [types.ts:235](https://github.com/quojs/quojs/blob/67acf22c99f7bb5bc1300e174ce891cc1abf66aa/packages/core/src/types.ts#L235)

Connect type tied to a specific state record S keyed by reducer names R.
- property accepts top-level keys, deep dotted paths, or wildcard patterns over them

## Type Parameters

### R

`R` *extends* `string`

### S

`S` *extends* `Record`\<`R`, `any`\>

## Properties

### property

> **property**: [`WithGlob`](WithGlob.md)\<[`Dotted`](Dotted.md)\<`S`\[`R`\]\>\>

Defined in: [types.ts:240](https://github.com/quojs/quojs/blob/67acf22c99f7bb5bc1300e174ce891cc1abf66aa/packages/core/src/types.ts#L240)

***

### reducer

> **reducer**: `R`

Defined in: [types.ts:239](https://github.com/quojs/quojs/blob/67acf22c99f7bb5bc1300e174ce891cc1abf66aa/packages/core/src/types.ts#L239)
