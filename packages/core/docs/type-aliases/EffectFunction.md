[**@quojs/core**](../README.md)

***

[@quojs/core](../README.md) / EffectFunction

# Type Alias: EffectFunction()\<S, AM\>

> **EffectFunction**\<`S`, `AM`\> = \<`C`, `E`\>(`action`, `getState`, `dispatch`) => `void` \| `Promise`\<`void`\>

Defined in: [types.ts:168](https://github.com/quojs/quojs/blob/67acf22c99f7bb5bc1300e174ce891cc1abf66aa/packages/core/src/types.ts#L168)

Side-effect handler: runs AFTER reducers, sees the final state

## Type Parameters

### S

`S` = `any`

### AM

`AM` *extends* [`ActionMapBase`](ActionMapBase.md) = [`ActionMapBase`](ActionMapBase.md)

## Type Parameters

### C

`C` *extends* keyof `AM`

### E

`E` *extends* keyof `AM`\[`C`\]

## Parameters

### action

[`Action`](../interfaces/Action.md)\<`AM`, `C`, `E`\>

### getState

() => `S`

### dispatch

[`Dispatch`](Dispatch.md)\<`AM`\>

## Returns

`void` \| `Promise`\<`void`\>
