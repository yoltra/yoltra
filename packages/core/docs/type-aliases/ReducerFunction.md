[**@quojs/core**](../README.md)

***

[@quojs/core](../README.md) / ReducerFunction

# Type Alias: ReducerFunction()\<S, EM\>

> **ReducerFunction**\<`S`, `EM`\> = (`state`, `event`) => `S`

Defined in: [types.ts:418](https://github.com/quojs/quojs/blob/d7e7368223439ffec372ae1e5232d6f03b0a0e1f/packages/core/src/types.ts#L418)

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
