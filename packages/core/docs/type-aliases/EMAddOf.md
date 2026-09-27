![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

[**@yoltra/core**](../README.md)

***

[@yoltra/core](../README.md) / EMAddOf

# Type Alias: EMAddOf\<X\>

> **EMAddOf**\<`X`\> = `X` *extends* `object` ? `E` *extends* [`EventMapBase`](EventMapBase.md) ? `E` : [`EmptyEventMap`](EmptyEventMap.md) : [`EmptyEventMap`](EmptyEventMap.md)

Defined in: [types.ts:1975](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L1975)

Reads the event map a spec contributes, or `{}` when it declares none.

## Type Parameters

### X

`X`

## Remarks

Only a branded spec widens the event map. An unbranded object literal contributes `{}`,
which is today's behaviour and therefore always safe.
