![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

[**@yoltra/core**](../README.md)

***

[@yoltra/core](../README.md) / eventKeys

# Function: eventKeys()

> **eventKeys**\<`EM`\>(): \<`K`\>(`keys`) => `K`

Defined in: [types.ts:1051](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L1051)

Helper to create type-safe EventKey arrays without requiring `as const`.
Preserves literal tuple types for proper type correlation in handlers.

## Type Parameters

### EM

`EM` *extends* [`EventMapBase`](../type-aliases/EventMapBase.md)

Event map.

## Returns

> \<`K`\>(`keys`): `K`

### Type Parameters

#### K

`K` *extends* readonly [`EventKey`](../type-aliases/EventKey.md)\<`EM`\>[]

### Parameters

#### keys

`K`

### Returns

`K`

## Example

```ts
type AppEM = {
  ui: { increment: number; decrement: number };
  data: { loaded: string[] };
};

// Without helper (requires `as const`):
const keys = [['ui', 'increment'], ['ui', 'decrement']] as const;

// With helper (no `as const` needed):
const keys = eventKeys<AppEM>()([
  ['ui', 'increment'],
  ['ui', 'decrement'],
]);
// Type: readonly [['ui', 'increment'], ['ui', 'decrement']]
```
