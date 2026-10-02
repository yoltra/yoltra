![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

[**@yoltra/core**](../README.md)

***

[@yoltra/core](../README.md) / Clock

# Interface: Clock

Defined in: [types.ts:611](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L611)

Where a store reads the time.

## Remarks

Called as a method, so a class instance keeps its `this`. Only `now()` is read, so a clock with
more members is accepted as it is.

## Methods

### now()

> **now**(): `number`

Defined in: [types.ts:613](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L613)

Milliseconds since the epoch.

#### Returns

`number`
