![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

[**@yoltra/core**](../README.md)

***

[@yoltra/core](../README.md) / EmitResult

# Interface: EmitResult

Defined in: [types.ts:211](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L211)

What an `emit` resolves to once its effects have run.

## Remarks

`emit` used to resolve to `void`, so a caller could not tell "the reducer applied my write"
from "the reducer looked at my write and returned the state unchanged". On a single-writer
store that distinction is academic; on a contended one it is a lost update the API could not
report.

Deliberately does **not** carry the changed paths. Building that list costs a string
concatenation per changed path on every emit, and almost no caller reads it — the same reason
change notifications are built lazily. Instrumentation already provides them to the observers
that do want them.

## Properties

### committed

> `readonly` **committed**: `boolean`

Defined in: [types.ts:219](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L219)

The event was not vetoed by middleware.

#### Remarks

Unchanged in meaning, and deliberately not narrowed to "state changed" — an event-only store
commits every event and writes nothing, by construction.

***

### reason?

> `readonly` `optional` **reason**: [`NotCommittedReason`](../type-aliases/NotCommittedReason.md)

Defined in: [types.ts:235](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L235)

Why the event did not commit. Absent when it did.

#### Remarks

`committed: false` used to arrive from three unrelated causes through one shared frozen
object, so a caller could not tell a guard refusing an action from a double-click being
deduplicated - which want opposite responses. A submit button should show the refusal and
say nothing about the duplicate.

See [EmitResult.vetoedBy](#vetoedby) for which middleware refused it.

***

### rejected?

> `readonly` `optional` **rejected**: [`Rejection`](Rejection.md)

Defined in: [types.ts:223](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L223)

Present when a reducer refused the write. See [Rejection](Rejection.md).

***

### vetoedBy?

> `readonly` `optional` **vetoedBy**: `string`

Defined in: [types.ts:245](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L245)

The name of the middleware that vetoed, when it declared one through `meta.name`.

#### Remarks

A reducer refusal has always named its slice, through `rejectedBy` and `onRejected`. A
middleware veto named nobody, so "the event vanished" had no attribution at all. A bare
middleware function contributes its own function name; an anonymous one leaves this
absent.

***

### written

> `readonly` **written**: `boolean`

Defined in: [types.ts:221](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L221)

A reducer actually changed state.
