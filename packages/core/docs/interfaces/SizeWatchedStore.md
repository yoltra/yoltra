![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

[**@yoltra/core**](../README.md)

***

[@yoltra/core](../README.md) / SizeWatchedStore

# Interface: SizeWatchedStore

Defined in: [diagnostics/warnOnLargeValues.ts:17](https://github.com/yoltra/yoltra/blob/main/packages/core/src/diagnostics/warnOnLargeValues.ts#L17)

The store surface the helper needs.

## Properties

### name?

> `readonly` `optional` **name**: `string`

Defined in: [diagnostics/warnOnLargeValues.ts:18](https://github.com/yoltra/yoltra/blob/main/packages/core/src/diagnostics/warnOnLargeValues.ts#L18)

## Methods

### getState()

> **getState**(): `unknown`

Defined in: [diagnostics/warnOnLargeValues.ts:19](https://github.com/yoltra/yoltra/blob/main/packages/core/src/diagnostics/warnOnLargeValues.ts#L19)

#### Returns

`unknown`

***

### instrument()

> **instrument**(`observer`, `options?`): [`Unsubscribe`](../type-aliases/Unsubscribe.md)

Defined in: [diagnostics/warnOnLargeValues.ts:20](https://github.com/yoltra/yoltra/blob/main/packages/core/src/diagnostics/warnOnLargeValues.ts#L20)

#### Parameters

##### observer

[`InstrumentationObserver`](../type-aliases/InstrumentationObserver.md)\<`any`\>

##### options?

[`InstrumentOptions`](InstrumentOptions.md)

#### Returns

[`Unsubscribe`](../type-aliases/Unsubscribe.md)
