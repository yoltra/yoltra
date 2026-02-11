[**@quojs/core**](../README.md)

***

[@quojs/core](../README.md) / Emit

# Type Alias: Emit()\<EM\>

> **Emit**\<`EM`\> = \<`C`, `T`\>(`channel`, `type`, `payload`) => `Promise`\<`void`\>

Defined in: [types.ts:124](https://github.com/quojs/quojs/blob/7a847d68175722f00e52941458a1511185cf0a4e/packages/core/src/types.ts#L124)

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
