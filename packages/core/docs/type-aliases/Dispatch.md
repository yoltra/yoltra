[**@quojs/core**](../README.md)

***

[@quojs/core](../README.md) / Dispatch

# Type Alias: Dispatch()\<AM\>

> **Dispatch**\<`AM`\> = \<`C`, `E`\>(`channel`, `event`, `payload`) => `void`

Defined in: [types.ts:35](https://github.com/quojs/quojs/blob/67acf22c99f7bb5bc1300e174ce891cc1abf66aa/packages/core/src/types.ts#L35)

Dispatch narrowed to the developer’s ActionMap

## Type Parameters

### AM

`AM` *extends* [`ActionMapBase`](ActionMapBase.md)

## Type Parameters

### C

`C` *extends* keyof `AM`

### E

`E` *extends* keyof `AM`\[`C`\]

## Parameters

### channel

`C`

### event

`E`

### payload

`AM`\[`C`\]\[`E`\]

## Returns

`void`
