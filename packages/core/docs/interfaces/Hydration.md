[**@yoltra/core**](../README.md)

***

[@yoltra/core](../README.md) / Hydration

# Interface: Hydration

Defined in: [persistence/persist.ts:65](https://github.com/yoltra/yoltra/blob/main/packages/core/src/persistence/persist.ts#L65)

What [hydrate](../functions/hydrate.md) recovered.

## Properties

### restored

> `readonly` **restored**: `boolean`

Defined in: [persistence/persist.ts:69](https://github.com/yoltra/yoltra/blob/main/packages/core/src/persistence/persist.ts#L69)

`true` when a payload was found, decoded and accepted.

***

### slices

> `readonly` **slices**: `Readonly`\<`Record`\<`string`, `unknown`\>\>

Defined in: [persistence/persist.ts:67](https://github.com/yoltra/yoltra/blob/main/packages/core/src/persistence/persist.ts#L67)

Slice states to start from. Empty when there was nothing usable to restore.
