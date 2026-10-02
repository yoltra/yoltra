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

### at

> **at**: `number`

Defined in: [types.ts:424](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L424)

When the store processed the event, in epoch milliseconds from [StoreSpec.clock](../type-aliases/StoreSpec.md#clock).

#### Remarks

Read once per event, after its reducers ran, and only while an observer is registered. It is
the timestamp an observer that records or exports events needs; for how long reducing took,
read [InstrumentedEvent.reduceTimeMs](#reducetimems).

***

### changedPaths

> **changedPaths**: `string`[]

Defined in: [types.ts:403](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L403)

Dotted **leaf** paths that changed, prefixed with the slice name (e.g.
`"todos.items.0.title"`). Empty when nothing changed. These are the exact
paths the store computed while reducing — no re-diff required.

***

### committed

> **committed**: `boolean`

Defined in: [types.ts:397](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L397)

`true` if the event passed middleware and ran reducers; `false` if vetoed.

***

### event

> **event**: `object`

Defined in: [types.ts:385](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L385)

The processed event, including its `id`, any [EventMeta](../type-aliases/EventMeta.md) the emitter attached, and its
place in a causal chain. `meta`, `parentId` and `depth` are absent unless the event has them,
as on [Event](Event.md).

#### channel

> **channel**: `string`

#### depth?

> `optional` **depth**: `number`

[Event.depth](Event.md#depth): how deep in a causal chain this event is. Absent on a root event.

#### id

> **id**: `string`

#### meta?

> `optional` **meta**: `Readonly`\<`Record`\<`string`, `unknown`\>\>

#### parentId?

> `optional` **parentId**: `string`

[Event.parentId](Event.md#parentid): the event whose handling caused this one. Absent on a root event.

#### payload

> **payload**: `unknown`

#### type

> **type**: `string`

***

### nextValues

> **nextValues**: `Record`\<`string`, `unknown`\>

Defined in: [types.ts:407](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L407)

New value at each changed path, keyed by path.

***

### prevValues

> **prevValues**: `Record`\<`string`, `unknown`\>

Defined in: [types.ts:405](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L405)

Old value at each changed path, keyed by path.

***

### reason?

> `optional` **reason**: [`NotCommittedReason`](../type-aliases/NotCommittedReason.md)

Defined in: [types.ts:448](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L448)

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

Defined in: [types.ts:415](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L415)

Milliseconds spent in the synchronous reduce phase for this event.

#### Remarks

A duration, measured with `performance.now()` (falling back to `Date.now()` where it is
missing), so it is unaffected by changes to the system clock. It is not a time of day.

***

### rejected?

> `optional` **rejected**: [`Rejection`](Rejection.md)

Defined in: [types.ts:433](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L433)

Present when a reducer refused the write, carrying its reason.

#### Remarks

Distinct from `committed: false`, which means middleware vetoed the event before any reducer
saw it. This is a reducer having considered the write and declined it — the two look
identical in state and are entirely different in cause.

***

### vetoedBy?

> `optional` **vetoedBy**: `string`

Defined in: [types.ts:457](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L457)

Which middleware vetoed, when one did and it had a name.

#### Remarks

The same value [EmitResult.vetoedBy](EmitResult.md#vetoedby) carries: a spec's `meta.name`, or a plain
function's `name`. Absent for an anonymous function, and absent whenever the event committed.
A middleware that throws is attributed too — a throw is treated as a veto.
