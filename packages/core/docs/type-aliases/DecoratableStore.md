![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

[**@yoltra/core**](../README.md)

***

[@yoltra/core](../README.md) / DecoratableStore

# Type Alias: DecoratableStore\<R, S, EM\>

> **DecoratableStore**\<`R`, `S`, `EM`\> = [`StoreInstance`](../interfaces/StoreInstance.md)\<`R`, `S`, `EM`\> & [`StoreDecoration`](../interfaces/StoreDecoration.md)\<`R`, `S`, `EM`\>

Defined in: [types.ts:1797](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L1797)

A store that can be decorated, and whose type grows as it is.

## Type Parameters

### R

`R` *extends* `string`

### S

`S` *extends* `Record`\<`R`, `any`\>

### EM

`EM` *extends* [`EventMapBase`](EventMapBase.md)
