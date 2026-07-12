[**@yoltra/core**](../README.md)

***

[@yoltra/core](../README.md) / EventKey

# Type Alias: EventKey\<EM\>

> **EventKey**\<`EM`\> = `{ [C in keyof EM & string]: [C, keyof EM[C] & string] }`\[keyof `EM` & `string`\]

Defined in: [types.ts:47](https://github.com/yoltra/yoltra/blob/deb942c60b290a53939a9e286974c0da4e3f44ce/packages/core/src/types.ts#L47)

Canonical routing concept: a readonly tuple `[channel, type]` that uniquely identifies an event.

## Type Parameters

### EM

`EM` *extends* [`EventMapBase`](EventMapBase.md)

Event map.

## Remarks

- Used consistently across ReducerSpec, EffectSpec, and React hooks.
- Literal key lists narrow channel/type/payload in reducers and effects.
- Non-literal usage degrades safely to unions.

## Example

```ts
type EM = {
  ui: { increment: number; decrement: number };
  data: { loaded: string[] };
};

type K = EventKey<EM>;
// K = ['ui', 'increment'] | ['ui', 'decrement'] | ['data', 'loaded']

const key: EventKey<EM> = ['ui', 'increment'];
```
