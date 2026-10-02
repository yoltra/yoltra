![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

[**@yoltra/core**](../README.md)

***

[@yoltra/core](../README.md) / CancelKey

# Type Alias: CancelKey\<EM\>

> **CancelKey**\<`EM`\> = `{ [C in keyof EM & string]: { [T in keyof EM[C] & string]: CallCancellation extends EM[C][T] ? readonly [C, T] : never }[keyof EM[C] & string] }`\[keyof `EM` & `string`\]

Defined in: [store/call.ts:70](https://github.com/yoltra/yoltra/blob/main/packages/core/src/store/call.ts#L70)

The `[channel, type]` pairs whose payload can carry a [CallCancellation](../interfaces/CallCancellation.md).

## Type Parameters

### EM

`EM` *extends* [`EventMapBase`](EventMapBase.md)
