[**@yoltra/core**](../README.md)

***

[@yoltra/core](../README.md) / EventUnion

# Type Alias: EventUnion\<EM\>

> **EventUnion**\<`EM`\> = `{ [C in keyof EM & string]: { [T in keyof EM[C] & string]: Event<EM, C, T> }[keyof EM[C] & string] }`\[keyof `EM` & `string`\]

Defined in: [types.ts:737](https://github.com/yoltra/yoltra/blob/ae94dea5790844eac37ee002f0fbed302029371e/packages/core/src/types.ts#L737)

Every legal `{ channel, type, payload, id }` as a *distinct* object type.

## Type Parameters

### EM

`EM` *extends* [`EventMapBase`](EventMapBase.md)

Event map.
