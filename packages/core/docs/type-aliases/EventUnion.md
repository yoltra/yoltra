[**@yoltra/core**](../README.md)

***

[@yoltra/core](../README.md) / EventUnion

# Type Alias: EventUnion\<EM\>

> **EventUnion**\<`EM`\> = `{ [C in keyof EM & string]: { [T in keyof EM[C] & string]: Event<EM, C, T> }[keyof EM[C] & string] }`\[keyof `EM` & `string`\]

Defined in: [types.ts:827](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L827)

Every legal `{ channel, type, payload, id }` as a *distinct* object type.

## Type Parameters

### EM

`EM` *extends* [`EventMapBase`](EventMapBase.md)

Event map.
