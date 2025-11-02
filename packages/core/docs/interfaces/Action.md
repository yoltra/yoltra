[**@quojs/core**](../README.md)

***

[@quojs/core](../README.md) / Action

# Interface: Action\<AM, C, E, P\>

Defined in: [types.ts:13](https://github.com/quojs/quojs/blob/67acf22c99f7bb5bc1300e174ce891cc1abf66aa/packages/core/src/types.ts#L13)

A single bus action

## Type Parameters

### AM

`AM` *extends* [`ActionMapBase`](../type-aliases/ActionMapBase.md) = [`ActionMapBase`](../type-aliases/ActionMapBase.md)

### C

`C` *extends* keyof `AM` = keyof `AM`

### E

`E` *extends* keyof `AM`\[`C`\] = keyof `AM`\[`C`\]

### P

`P` = `AM`\[`C`\]\[`E`\]

## Properties

### channel

> **channel**: `C`

Defined in: [types.ts:19](https://github.com/quojs/quojs/blob/67acf22c99f7bb5bc1300e174ce891cc1abf66aa/packages/core/src/types.ts#L19)

***

### event

> **event**: `E`

Defined in: [types.ts:20](https://github.com/quojs/quojs/blob/67acf22c99f7bb5bc1300e174ce891cc1abf66aa/packages/core/src/types.ts#L20)

***

### payload

> **payload**: `P`

Defined in: [types.ts:21](https://github.com/quojs/quojs/blob/67acf22c99f7bb5bc1300e174ce891cc1abf66aa/packages/core/src/types.ts#L21)
