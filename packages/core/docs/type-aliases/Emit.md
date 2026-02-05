[**@quojs/core**](../README.md)

***

[@quojs/core](../README.md) / Emit

# Type Alias: Emit()\<EM\>

> **Emit**\<`EM`\> = \<`C`, `T`\>(`channel`, `type`, `payload`) => `Promise`\<`void`\>

Defined in: [types.ts:124](https://github.com/quojs/quojs/blob/40c7b880e4398df15cb630b37a555ddd7d1624c7/packages/core/src/types.ts#L124)

Emit function narrowed to the developer's EventMap.
Returns a Promise that resolves when the event has been fully processed.

## Type Parameters

### EM

`EM` *extends* [`EventMapBase`](EventMapBase.md)

Event map.

## Type Parameters

### C

`C` *extends* keyof `EM` & `string`

### T

`T` *extends* keyof `EM`\[`C`\] & `string`

## Parameters

### channel

`C`

### type

`T`

### payload

`EM`\[`C`\]\[`T`\]

## Returns

`Promise`\<`void`\>

## Example

```ts
type EM = { ui: { increment: number } };
const emit: Emit<EM> = async (channel, type, payload) => { /* ... */ };
await emit('ui', 'increment', 1);
```
