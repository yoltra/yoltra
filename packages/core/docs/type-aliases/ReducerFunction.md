[**@quojs/core**](../README.md)

***

[@quojs/core](../README.md) / ReducerFunction

# Type Alias: ReducerFunction()\<S, EM\>

> **ReducerFunction**\<`S`, `EM`\> = (`state`, `event`) => `S`

Defined in: [types.ts:471](https://github.com/quojs/quojs/blob/3a7e48ef6dc2bf6db713ff04100a2a0e1ee72ff5/packages/core/src/types.ts#L471)

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
