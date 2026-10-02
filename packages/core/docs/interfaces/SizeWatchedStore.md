![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

[**@yoltra/core**](../README.md)

***

[@yoltra/core](../README.md) / SizeWatchedStore

# Interface: SizeWatchedStore

Defined in: diagnostics/warnOnLargeValues.ts:17

The store surface the helper needs.

## Properties

### name?

> `readonly` `optional` **name**: `string`

Defined in: diagnostics/warnOnLargeValues.ts:18

## Methods

### getState()

> **getState**(): `unknown`

Defined in: diagnostics/warnOnLargeValues.ts:19

#### Returns

`unknown`

***

### instrument()

> **instrument**(`observer`, `options?`): [`Unsubscribe`](../type-aliases/Unsubscribe.md)

Defined in: diagnostics/warnOnLargeValues.ts:20

#### Parameters

##### observer

[`InstrumentationObserver`](../type-aliases/InstrumentationObserver.md)\<`any`\>

##### options?

[`InstrumentOptions`](InstrumentOptions.md)

#### Returns

[`Unsubscribe`](../type-aliases/Unsubscribe.md)
