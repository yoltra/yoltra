![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

[**@yoltra/core**](../README.md)

***

[@yoltra/core](../README.md) / Event

# Interface: Event\<EM, C, T, P\>

Defined in: [types.ts:101](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L101)

A single event object: `{ channel, type, payload, id }`, plus optional `meta`.

## Remarks

- The `id` field is automatically added by the store to enable deduplication, unless the
  emitter supplies one via [EmitOptions.id](EmitOptions.md#id).
- Used for preventing duplicate event processing (e.g., React Strict Mode).
- `meta` is present only when [EmitOptions.meta](EmitOptions.md#meta) was supplied. See [EventMeta](../type-aliases/EventMeta.md).

## Example

```ts
type EM = { ui: { toggle: boolean } };
type Evt = Event<EM, 'ui', 'toggle'>;
// { channel: 'ui'; type: 'toggle'; payload: boolean; id: string; meta?: EventMeta }
```

## Type Parameters

### EM

`EM` *extends* [`EventMapBase`](../type-aliases/EventMapBase.md) = [`EventMapBase`](../type-aliases/EventMapBase.md)

Event map.

### C

`C` *extends* keyof `EM` & `string` = keyof `EM` & `string`

Channel key.

### T

`T` *extends* keyof `EM`\[`C`\] & `string` = keyof `EM`\[`C`\] & `string`

Type key within channel `C`.

### P

`P` = `EM`\[`C`\]\[`T`\]

Payload type (defaults to `EM[C][T]`).

## Properties

### channel

> **channel**: `C`

Defined in: [types.ts:107](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L107)

***

### depth?

> `readonly` `optional` **depth**: `number`

Defined in: [types.ts:139](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L139)

How many events deep in a causal chain this one is. A root event is depth `0`; an event
emitted while handling it is `1`, and so on.

#### Remarks

Absent on a root event rather than present as `0`, so an event emitted by application code
stays byte-identical to one built before causality tracking existed — the same treatment
[Event.meta](#meta) gets, and for the same reason: `Object.keys` and `toStrictEqual` are load
bearing in consumer tests.

This is the value [StoreSpec.maxReduceDepth](../type-aliases/StoreSpec.md#maxreducedepth) bounds.

***

### id

> **id**: `string`

Defined in: [types.ts:111](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L111)

Unique identifier for deduplication and devtools tracking (automatically added by store)

***

### meta?

> `readonly` `optional` **meta**: `Readonly`\<`Record`\<`string`, `unknown`\>\>

Defined in: [types.ts:116](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L116)

Optional caller-supplied metadata, carried through the pipeline untouched.
Absent entirely unless [EmitOptions.meta](EmitOptions.md#meta) was supplied. See [EventMeta](../type-aliases/EventMeta.md).

***

### parentId?

> `readonly` `optional` **parentId**: `string`

Defined in: [types.ts:126](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L126)

The `id` of the event whose handling caused this one, when there was one.

#### Remarks

Absent on a **root** event — one emitted by application code rather than by a middleware,
subscriber or effect reacting to another event. Together with [Event.depth](#depth) this makes
a cascade legible after the fact: without it, a runaway chain is a pile of unrelated events
with no way to tell which caused which.

***

### payload

> **payload**: `P`

Defined in: [types.ts:109](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L109)

***

### type

> **type**: `T`

Defined in: [types.ts:108](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L108)
