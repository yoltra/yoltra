![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

[**@yoltra/core**](../README.md)

***

[@yoltra/core](../README.md) / MiddlewareFunction

# Type Alias: MiddlewareFunction()\<S, EM\>

> **MiddlewareFunction**\<`S`, `EM`\> = (`state`, `event`, `emit`) => `boolean` \| `void`

Defined in: [types.ts:1111](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L1111)

Middleware function: log, guard, or veto an event **synchronously**.

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

`boolean` \| `void`

## Remarks

**Only an explicit `false` vetoes.** Returning `true`, or returning nothing at all, allows
the event, so middleware that only logs or measures can simply fall off the end.

The return type is `boolean | void` rather than `boolean` for that reason: under these
semantics an omitted `return` is correct, so making the compiler demand one would be
wrong. It was `boolean` while any falsy value vetoed, which made a missing `return`
silently swallow every event the middleware matched.

Middleware runs in the synchronous reduce phase (so `getState()` is correct
immediately after `emit()`), and therefore must be synchronous. Perform async
work in effects instead - a `Promise` is not `false`, so an async middleware allows the
event while it is still deciding, and the store logs an error in development when it sees
one returned.

A middleware that **throws** vetoes the event and logs, naming the event: a guard that
crashed has not decided the event is safe.
