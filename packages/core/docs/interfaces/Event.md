[**@quojs/core**](../README.md)

***

[@quojs/core](../README.md) / Event

# Interface: Event\<EM, C, T, P\>

Defined in: [types.ts:72](https://github.com/quojs/quojs/blob/74de3d2d0ff0336e38f1bb850c2a97571cea3f88/packages/core/src/types.ts#L72)

A single event object: `{ channel, type, payload, id }`.

## Remarks

- The `id` field is automatically added by the store to enable deduplication.
- Used for preventing duplicate event processing (e.g., React Strict Mode).

## Example

```ts
type EM = { ui: { toggle: boolean } };
type Evt = Event<EM, 'ui', 'toggle'>;
// { channel: 'ui'; type: 'toggle'; payload: boolean; id: symbol }
```

## Type Parameters

### EM

`EM` *extends* [`EventMapBase`](../type-aliases/EventMapBase.md) = [`EventMapBase`](../type-aliases/EventMapBase.md)

Event map.

### C

`C` *extends* keyof `EM` = keyof `EM`

Channel key.

### T

`T` *extends* keyof `EM`\[`C`\] = keyof `EM`\[`C`\]

Type key within channel `C`.

### P

`P` = `EM`\[`C`\]\[`T`\]

Payload type (defaults to `EM[C][T]`).

## Properties

### channel

> **channel**: `C`

Defined in: [types.ts:78](https://github.com/quojs/quojs/blob/74de3d2d0ff0336e38f1bb850c2a97571cea3f88/packages/core/src/types.ts#L78)

***

### id

> **id**: `symbol`

Defined in: [types.ts:82](https://github.com/quojs/quojs/blob/74de3d2d0ff0336e38f1bb850c2a97571cea3f88/packages/core/src/types.ts#L82)

Unique identifier for deduplication (automatically added by store)

***

### payload

> **payload**: `P`

Defined in: [types.ts:80](https://github.com/quojs/quojs/blob/74de3d2d0ff0336e38f1bb850c2a97571cea3f88/packages/core/src/types.ts#L80)

***

### type

> **type**: `T`

Defined in: [types.ts:79](https://github.com/quojs/quojs/blob/74de3d2d0ff0336e38f1bb850c2a97571cea3f88/packages/core/src/types.ts#L79)
