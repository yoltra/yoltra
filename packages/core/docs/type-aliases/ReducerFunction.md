[**@quojs/core**](../README.md)

***

[@quojs/core](../README.md) / ReducerFunction

# Type Alias: ReducerFunction()\<S, EM\>

> **ReducerFunction**\<`S`, `EM`\> = (`state`, `event`) => `S`

Defined in: [types.ts:471](https://github.com/quojs/quojs/blob/40c7b880e4398df15cb630b37a555ddd7d1624c7/packages/core/src/types.ts#L471)

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
