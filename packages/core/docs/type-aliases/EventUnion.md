[**@quojs/core**](../README.md)

***

[@quojs/core](../README.md) / EventUnion

# Type Alias: EventUnion\<EM\>

> **EventUnion**\<`EM`\> = `{ [C in keyof EM]: { [T in keyof EM[C]]: Event<EM, C, T> }[keyof EM[C]] }`\[keyof `EM`\]

Defined in: [types.ts:466](https://github.com/quojs/quojs/blob/d7e7368223439ffec372ae1e5232d6f03b0a0e1f/packages/core/src/types.ts#L466)

Every legal `{ channel, type, payload, id }` as a *distinct* object type.

## Type Parameters

### EM

`EM` *extends* [`EventMapBase`](EventMapBase.md)

Event map.
