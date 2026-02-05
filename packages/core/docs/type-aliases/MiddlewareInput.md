[**@quojs/core**](../README.md)

***

[@quojs/core](../README.md) / MiddlewareInput

# Type Alias: MiddlewareInput\<S, EM\>

> **MiddlewareInput**\<`S`, `EM`\> = [`MiddlewareFunction`](MiddlewareFunction.md)\<`S`, `EM`\> \| [`MiddlewareSpec`](../interfaces/MiddlewareSpec.md)\<`S`, `EM`\>

Defined in: [types.ts:177](https://github.com/quojs/quojs/blob/40c7b880e4398df15cb630b37a555ddd7d1624c7/packages/core/src/types.ts#L177)

Middleware input: accepts either a function (legacy) or a spec object (recommended).

## Type Parameters

### S

`S` = `any`

Store state (readonly).

### EM

`EM` *extends* [`EventMapBase`](EventMapBase.md) = [`EventMapBase`](EventMapBase.md)

Event map.
