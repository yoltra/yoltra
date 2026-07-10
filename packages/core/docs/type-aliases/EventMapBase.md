[**@yoltra/core**](../README.md)

***

[@yoltra/core](../README.md) / EventMapBase

# Type Alias: EventMapBase

> **EventMapBase** = `{ [C in string]: { [T in string]: unknown } }`

Defined in: [types.ts:18](https://github.com/yoltra/yoltra/blob/ae94dea5790844eac37ee002f0fbed302029371e/packages/core/src/types.ts#L18)

A minimal "record of record" constraint for EventMaps.

## Example

```ts
type EM = {
  ui: { toggle: boolean; setTheme: string };
  data: { loaded: { items: string[] } };
};
```
