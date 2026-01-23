[**@quojs/core**](../README.md)

***

[@quojs/core](../README.md) / ReducerFunction

# Type Alias: ReducerFunction()\<S, EM\>

> **ReducerFunction**\<`S`, `EM`\> = (`state`, `event`) => `S`

Defined in: [types.ts:370](https://github.com/quojs/quojs/blob/74de3d2d0ff0336e38f1bb850c2a97571cea3f88/packages/core/src/types.ts#L370)

Pure reducer function (stateful event consumer).

## Type Parameters

### S

`S` = `any`

State type.

### EM

`EM` *extends* [`EventMapBase`](EventMapBase.md) = [`EventMapBase`](EventMapBase.md)

Event map.

## Parameters

### state

`S`

### event

[`EventUnion`](EventUnion.md)\<`EM`\>

## Returns

`S`
