[**@quojs/core**](../README.md)

***

[@quojs/core](../README.md) / EventMapBase

# Type Alias: EventMapBase

> **EventMapBase** = `{ [C in string]: { [T in string]: unknown } }`

Defined in: [types.ts:18](https://github.com/quojs/quojs/blob/90b047cd5df060b28c5f76a1ad4792631061e571/packages/core/src/types.ts#L18)

A minimal "record of record" constraint for EventMaps.

## Example

```ts
type EM = {
  ui: { toggle: boolean; setTheme: string };
  data: { loaded: { items: string[] } };
};
```
