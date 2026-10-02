![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

[**@yoltra/core**](../README.md)

***

[@yoltra/core](../README.md) / InstrumentedEvent

# Interface: InstrumentedEvent\<EM\>

Defined in: [types.ts:379](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L379)

A single observed event delivered to an [InstrumentationObserver](../type-aliases/InstrumentationObserver.md).

## Type Parameters

### EM

`EM` *extends* [`EventMapBase`](../type-aliases/EventMapBase.md) = [`EventMapBase`](../type-aliases/EventMapBase.md)

Event map.

## Properties

### changedPaths

> **changedPaths**: `string`[]

Defined in: [types.ts:392](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L392)

Dotted **leaf** paths that changed, prefixed with the slice name (e.g.
`"todos.items.0.title"`). Empty when nothing changed. These are the exact
paths the store computed while reducing — no re-diff required.

***

### committed

> **committed**: `boolean`

Defined in: [types.ts:386](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L386)

`true` if the event passed middleware and ran reducers; `false` if vetoed.

***

### event

> **event**: `object`

Defined in: [types.ts:384](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L384)

The processed event, including its `id` and any [EventMeta](../type-aliases/EventMeta.md) the emitter attached.
`meta` is absent unless it was supplied.

#### channel

> **channel**: `string`

#### id

> **id**: `string`

#### meta?

> `optional` **meta**: `Readonly`\<`Record`\<`string`, `unknown`\>\>

#### payload

> **payload**: `unknown`

#### type

> **type**: `string`

***

### nextValues

> **nextValues**: `Record`\<`string`, `unknown`\>

Defined in: [types.ts:396](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L396)

New value at each changed path, keyed by path.

***

### prevValues

> **prevValues**: `Record`\<`string`, `unknown`\>

Defined in: [types.ts:394](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L394)

Old value at each changed path, keyed by path.

***

### reason?

> `optional` **reason**: [`NotCommittedReason`](../type-aliases/NotCommittedReason.md)

Defined in: [types.ts:428](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L428)

Why the event did not commit. Absent when it did.

#### Remarks

The same value [EmitResult.reason](EmitResult.md#reason) carries, so an observer can tell a guard refusing an
action from a double-click being deduplicated — a distinction `committed: false` alone cannot
make, and the one an observer needs most, because instrumentation is the only seam that sees
uncommitted events without participating in the pipeline.

**In practice this reads `"vetoed"` or nothing.** A deduplicated event is dropped at `emit`
before it is ever queued, and a cascade refusal returns before the drain reaches
instrumentation, so neither is visible here at all. The type admits the other values because
it is shared with `EmitResult`, not because they are currently reachable.

***

### reduceTimeMs

> **reduceTimeMs**: `number`

Defined in: [types.ts:404](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L404)

Milliseconds spent in the synchronous reduce phase for this event.

#### Remarks

A duration, measured with `performance.now()` (falling back to `Date.now()` where it is
missing), so it is unaffected by changes to the system clock. It is not a time of day.

***

### rejected?

> `optional` **rejected**: [`Rejection`](Rejection.md)

Defined in: [types.ts:413](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L413)

Present when a reducer refused the write, carrying its reason.

#### Remarks

Distinct from `committed: false`, which means middleware vetoed the event before any reducer
saw it. This is a reducer having considered the write and declined it — the two look
identical in state and are entirely different in cause.

***

### vetoedBy?

> `optional` **vetoedBy**: `string`

Defined in: [types.ts:437](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L437)

Which middleware vetoed, when one did and it had a name.

#### Remarks

The same value [EmitResult.vetoedBy](EmitResult.md#vetoedby) carries: a spec's `meta.name`, or a plain
function's `name`. Absent for an anonymous function, and absent whenever the event committed.
A middleware that throws is attributed too — a throw is treated as a veto.
