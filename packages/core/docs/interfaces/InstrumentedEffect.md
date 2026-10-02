![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

[**@yoltra/core**](../README.md)

***

[@yoltra/core](../README.md) / InstrumentedEffect

# Interface: InstrumentedEffect

Defined in: [types.ts:477](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L477)

One effect's part in [InstrumentedEffects](InstrumentedEffects.md).

## Properties

### durationMs

> `readonly` **durationMs**: `number`

Defined in: [types.ts:486](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L486)

From its start to its settlement, measured with `performance.now()`.

***

### failed

> `readonly` **failed**: `boolean`

Defined in: [types.ts:488](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L488)

Whether it threw or rejected. The error itself reaches the diagnostics seam as `effect-error`.

***

### name?

> `readonly` `optional` **name**: `string`

Defined in: [types.ts:479](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L479)

`EffectSpec.meta.name`, else the function's own name, when it has one.

***

### origin

> `readonly` **origin**: [`Origin`](../type-aliases/Origin.md)

Defined in: [types.ts:484](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L484)

How the effect was registered. `internal` is the store's own machinery, such as the reply
listener behind `store.call()`.
