![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

[**@yoltra/core**](../README.md)

***

[@yoltra/core](../README.md) / LargeValueLimits

# Interface: LargeValueLimits

Defined in: [diagnostics/warnOnLargeValues.ts:33](https://github.com/yoltra/yoltra/blob/main/packages/core/src/diagnostics/warnOnLargeValues.ts#L33)

Limits for [warnOnLargeValues](../functions/warnOnLargeValues.md). A value warns when it exceeds either of its limits.

## Remarks

Values are counted the way the codec counts them: every object, array, map or set entry and
every leaf is one. Bytes are an estimate of the serialized size: a string by its length, a
number as 8, a typed array or `ArrayBuffer` by its `byteLength`, plus object keys.

## Properties

### maxPayloadBytes?

> `readonly` `optional` **maxPayloadBytes**: `number`

Defined in: [diagnostics/warnOnLargeValues.ts:37](https://github.com/yoltra/yoltra/blob/main/packages/core/src/diagnostics/warnOnLargeValues.ts#L37)

#### Default Value

```ts
262 144 (256 KB)
```

***

### maxPayloadNodes?

> `readonly` `optional` **maxPayloadNodes**: `number`

Defined in: [diagnostics/warnOnLargeValues.ts:35](https://github.com/yoltra/yoltra/blob/main/packages/core/src/diagnostics/warnOnLargeValues.ts#L35)

#### Default Value

```ts
5 000
```

***

### maxSliceBytes?

> `readonly` `optional` **maxSliceBytes**: `number`

Defined in: [diagnostics/warnOnLargeValues.ts:44](https://github.com/yoltra/yoltra/blob/main/packages/core/src/diagnostics/warnOnLargeValues.ts#L44)

#### Default Value

```ts
4 194 304 (4 MB)
```

***

### maxSliceNodes?

> `readonly` `optional` **maxSliceNodes**: `number`

Defined in: [diagnostics/warnOnLargeValues.ts:42](https://github.com/yoltra/yoltra/blob/main/packages/core/src/diagnostics/warnOnLargeValues.ts#L42)

#### Default Value

50 000, half of the persistence budget, so a slice warns well before `persist`
would refuse to write it.

***

### warn()?

> `readonly` `optional` **warn**: (`message`, `detail`) => `void`

Defined in: [diagnostics/warnOnLargeValues.ts:46](https://github.com/yoltra/yoltra/blob/main/packages/core/src/diagnostics/warnOnLargeValues.ts#L46)

Receives each warning. Defaults to `console.warn`.

#### Parameters

##### message

`string`

##### detail

`Readonly`\<`Record`\<`string`, `unknown`\>\>

#### Returns

`void`
