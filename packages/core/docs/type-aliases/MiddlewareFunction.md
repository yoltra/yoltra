[**@yoltra/core**](../README.md)

***

[@yoltra/core](../README.md) / MiddlewareFunction

# Type Alias: MiddlewareFunction()\<S, EM\>

> **MiddlewareFunction**\<`S`, `EM`\> = (`state`, `event`, `emit`) => `boolean`

Defined in: [types.ts:757](https://github.com/yoltra/yoltra/blob/deb942c60b290a53939a9e286974c0da4e3f44ce/packages/core/src/types.ts#L757)

Middleware function: log, guard, or veto an event **synchronously**.
Return `true` to continue, `false` to swallow / cancel propagation.

## Type Parameters

### S

`S` = `any`

Store state (readonly).

### EM

`EM` *extends* [`EventMapBase`](EventMapBase.md) = [`EventMapBase`](EventMapBase.md)

Event map.

## Parameters

### state

`S`

### event

[`EventUnion`](EventUnion.md)\<`EM`\>

### emit

[`Emit`](Emit.md)\<`EM`\>

## Returns

`boolean`

## Remarks

Middleware runs in the synchronous reduce phase (so `getState()` is correct
immediately after `emit()`), and therefore must be synchronous. Perform async
work in effects instead.
