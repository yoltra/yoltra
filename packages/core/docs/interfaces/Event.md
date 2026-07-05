[**@yoltra/core**](../README.md)

***

[@yoltra/core](../README.md) / Event

# Interface: Event\<EM, C, T, P\>

Defined in: [types.ts:72](https://github.com/yoltra/yoltra/blob/ae94dea5790844eac37ee002f0fbed302029371e/packages/core/src/types.ts#L72)

A single event object: `{ channel, type, payload, id }`.

## Remarks

- The `id` field is automatically added by the store to enable deduplication.
- Used for preventing duplicate event processing (e.g., React Strict Mode).

## Example

```ts
type EM = { ui: { toggle: boolean } };
type Evt = Event<EM, 'ui', 'toggle'>;
// { channel: 'ui'; type: 'toggle'; payload: boolean; id: string }
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

Defined in: [types.ts:78](https://github.com/yoltra/yoltra/blob/ae94dea5790844eac37ee002f0fbed302029371e/packages/core/src/types.ts#L78)

***

### id

> **id**: `string`

Defined in: [types.ts:82](https://github.com/yoltra/yoltra/blob/ae94dea5790844eac37ee002f0fbed302029371e/packages/core/src/types.ts#L82)

Unique identifier for deduplication and devtools tracking (automatically added by store)

***

### payload

> **payload**: `P`

Defined in: [types.ts:80](https://github.com/yoltra/yoltra/blob/ae94dea5790844eac37ee002f0fbed302029371e/packages/core/src/types.ts#L80)

***

### type

> **type**: `T`

Defined in: [types.ts:79](https://github.com/yoltra/yoltra/blob/ae94dea5790844eac37ee002f0fbed302029371e/packages/core/src/types.ts#L79)
