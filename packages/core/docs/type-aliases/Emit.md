[**@quojs/core**](../README.md)

***

[@quojs/core](../README.md) / Emit

# Type Alias: Emit()\<EM\>

> **Emit**\<`EM`\> = \<`C`, `T`\>(`channel`, `type`, `payload`) => `Promise`\<`void`\>

Defined in: [types.ts:124](https://github.com/quojs/quojs/blob/d7e7368223439ffec372ae1e5232d6f03b0a0e1f/packages/core/src/types.ts#L124)

Emit function narrowed to the developer's EventMap.
Returns a Promise that resolves when the event has been fully processed.

## Type Parameters

### EM

`EM` *extends* [`EventMapBase`](EventMapBase.md)

Event map.

## Type Parameters

### C

`C` *extends* keyof `EM`

### T

`T` *extends* keyof `EM`\[`C`\]

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
