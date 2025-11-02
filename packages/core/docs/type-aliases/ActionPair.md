[**@quojs/core**](../README.md)

***

[@quojs/core](../README.md) / ActionPair

# Type Alias: ActionPair\<AM\>

> **ActionPair**\<`AM`\> = `{ [C in keyof AM & string]: [C, keyof AM[C] & string] }`\[keyof `AM` & `string`\]

Defined in: [types.ts:7](https://github.com/quojs/quojs/blob/67acf22c99f7bb5bc1300e174ce891cc1abf66aa/packages/core/src/types.ts#L7)

## Type Parameters

### AM

`AM` *extends* [`ActionMapBase`](ActionMapBase.md)
