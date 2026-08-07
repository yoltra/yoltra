![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

[**@yoltra/core**](../README.md)

***

[@yoltra/core](../README.md) / Event

# Interface: Event\<EM, C, T, P\>

Defined in: [types.ts:98](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L98)

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

Defined in: [types.ts:104](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L104)

***

### id

> **id**: `string`

Defined in: [types.ts:108](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L108)

Unique identifier for deduplication and devtools tracking (automatically added by store)

***

### meta?

> `readonly` `optional` **meta**: `Readonly`\<`Record`\<`string`, `unknown`\>\>

Defined in: [types.ts:113](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L113)

Optional caller-supplied metadata, carried through the pipeline untouched.
Absent entirely unless [EmitOptions.meta](EmitOptions.md#meta) was supplied. See [EventMeta](../type-aliases/EventMeta.md).

***

### payload

> **payload**: `P`

Defined in: [types.ts:106](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L106)

***

### type

> **type**: `T`

Defined in: [types.ts:105](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L105)
