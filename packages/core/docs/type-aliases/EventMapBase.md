[**@quojs/core**](../README.md)

***

[@quojs/core](../README.md) / EventMapBase

# Type Alias: EventMapBase

> **EventMapBase** = `{ [C in string]: { [T in string]: unknown } }`

Defined in: [types.ts:18](https://github.com/quojs/quojs/blob/40c7b880e4398df15cb630b37a555ddd7d1624c7/packages/core/src/types.ts#L18)

A minimal "record of record" constraint for EventMaps.

## Example

```ts
type EM = {
  ui: { toggle: boolean; setTheme: string };
  data: { loaded: { items: string[] } };
};
```
