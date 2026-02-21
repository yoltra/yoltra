[**@yoltra/core**](../README.md)

***

[@yoltra/core](../README.md) / EventUnion

# Type Alias: EventUnion\<EM\>

> **EventUnion**\<`EM`\> = `{ [C in keyof EM & string]: { [T in keyof EM[C] & string]: Event<EM, C, T> }[keyof EM[C] & string] }`\[keyof `EM` & `string`\]

Defined in: [types.ts:637](https://github.com/yoltra/yoltra/blob/7bf784f9e7daaf114608ff30306ac3400da926ed/packages/core/src/types.ts#L637)

Every legal `{ channel, type, payload, id }` as a *distinct* object type.

## Type Parameters

### EM

`EM` *extends* [`EventMapBase`](EventMapBase.md)

Event map.
