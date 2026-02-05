[**@quojs/core**](../README.md)

***

[@quojs/core](../README.md) / EventUnion

# Type Alias: EventUnion\<EM\>

> **EventUnion**\<`EM`\> = `{ [C in keyof EM & string]: { [T in keyof EM[C] & string]: Event<EM, C, T> }[keyof EM[C] & string] }`\[keyof `EM` & `string`\]

Defined in: [types.ts:542](https://github.com/quojs/quojs/blob/40c7b880e4398df15cb630b37a555ddd7d1624c7/packages/core/src/types.ts#L542)

Every legal `{ channel, type, payload, id }` as a *distinct* object type.

## Type Parameters

### EM

`EM` *extends* [`EventMapBase`](EventMapBase.md)

Event map.
