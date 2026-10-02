![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

[**@yoltra/core**](../README.md)

***

[@yoltra/core](../README.md) / Hydration

# Interface: Hydration

Defined in: [persistence/persist.ts:122](https://github.com/yoltra/yoltra/blob/main/packages/core/src/persistence/persist.ts#L122)

What [hydrate](../functions/hydrate.md) recovered.

## Properties

### restored

> `readonly` **restored**: `boolean`

Defined in: [persistence/persist.ts:126](https://github.com/yoltra/yoltra/blob/main/packages/core/src/persistence/persist.ts#L126)

`true` when a payload was found, decoded and accepted.

***

### slices

> `readonly` **slices**: `Readonly`\<`Record`\<`string`, `unknown`\>\>

Defined in: [persistence/persist.ts:124](https://github.com/yoltra/yoltra/blob/main/packages/core/src/persistence/persist.ts#L124)

Slice states to start from. Empty when there was nothing usable to restore.
