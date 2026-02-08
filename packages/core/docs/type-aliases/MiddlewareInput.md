[**@quojs/core**](../README.md)

***

[@quojs/core](../README.md) / MiddlewareInput

# Type Alias: MiddlewareInput\<S, EM\>

> **MiddlewareInput**\<`S`, `EM`\> = [`MiddlewareFunction`](MiddlewareFunction.md)\<`S`, `EM`\> \| [`MiddlewareSpec`](../interfaces/MiddlewareSpec.md)\<`S`, `EM`\>

Defined in: [types.ts:177](https://github.com/quojs/quojs/blob/90b047cd5df060b28c5f76a1ad4792631061e571/packages/core/src/types.ts#L177)

Middleware input: accepts either a function (legacy) or a spec object (recommended).

## Type Parameters

### S

`S` = `any`

Store state (readonly).

### EM

`EM` *extends* [`EventMapBase`](EventMapBase.md) = [`EventMapBase`](EventMapBase.md)

Event map.
