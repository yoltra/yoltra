[**@quojs/react**](../README.md)

***

[@quojs/react](../README.md) / UseEvent

# Type Alias: UseEvent()\<EM, S\>

> **UseEvent**\<`EM`, `S`\> = \<`C`, `T`\>(`channel`, `type`, `handler`, `phase?`) => `void`

Defined in: [react/src/hooks/createQuoHooks.ts:58](https://github.com/quojs/quojs/blob/90b047cd5df060b28c5f76a1ad4792631061e571/packages/react/src/hooks/createQuoHooks.ts#L58)

## Type Parameters

### EM

`EM` *extends* `EventMapBase`

### S

`S`

## Type Parameters

### C

`C` *extends* keyof `EM` & `string`

### T

`T` *extends* keyof `EM`\[`C`\] & `string`

## Parameters

### channel

`C`

### type

`T`

### handler

(`event`, `getState`, `emit`, `phase`) => `void` \| `Promise`\<`void`\>

### phase?

`EventPhase`

## Returns

`void`
