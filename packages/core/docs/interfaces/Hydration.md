![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

[**@yoltra/core**](../README.md)

***

[@yoltra/core](../README.md) / Hydration

# Interface: Hydration

Defined in: [persistence/persist.ts:75](https://github.com/yoltra/yoltra/blob/main/packages/core/src/persistence/persist.ts#L75)

What [hydrate](../functions/hydrate.md) recovered.

## Properties

### restored

> `readonly` **restored**: `boolean`

Defined in: [persistence/persist.ts:79](https://github.com/yoltra/yoltra/blob/main/packages/core/src/persistence/persist.ts#L79)

`true` when a payload was found, decoded and accepted.

***

### slices

> `readonly` **slices**: `Readonly`\<`Record`\<`string`, `unknown`\>\>

Defined in: [persistence/persist.ts:77](https://github.com/yoltra/yoltra/blob/main/packages/core/src/persistence/persist.ts#L77)

Slice states to start from. Empty when there was nothing usable to restore.
