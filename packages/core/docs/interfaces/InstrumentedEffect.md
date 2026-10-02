![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

[**@yoltra/core**](../README.md)

***

[@yoltra/core](../README.md) / InstrumentedEffect

# Interface: InstrumentedEffect

Defined in: [types.ts:493](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L493)

One effect's part in [InstrumentedEffects](InstrumentedEffects.md).

## Properties

### durationMs

> `readonly` **durationMs**: `number`

Defined in: [types.ts:502](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L502)

From its start to its settlement, measured with `performance.now()`.

***

### failed

> `readonly` **failed**: `boolean`

Defined in: [types.ts:504](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L504)

Whether it threw or rejected. The error itself reaches the diagnostics seam as `effect-error`.

***

### name?

> `readonly` `optional` **name**: `string`

Defined in: [types.ts:495](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L495)

`EffectSpec.meta.name`, else the function's own name, when it has one.

***

### origin

> `readonly` **origin**: [`Origin`](../type-aliases/Origin.md)

Defined in: [types.ts:500](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L500)

How the effect was registered. `internal` is the store's own machinery, such as the reply
listener behind `store.call()`.
