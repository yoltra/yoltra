[**@quojs/core**](../README.md)

***

[@quojs/core](../README.md) / EventUnion

# Type Alias: EventUnion\<EM\>

> **EventUnion**\<`EM`\> = `{ [C in keyof EM]: { [T in keyof EM[C]]: Event<EM, C, T> }[keyof EM[C]] }`\[keyof `EM`\]

Defined in: [types.ts:406](https://github.com/quojs/quojs/blob/8b1c0adc6b9ff8a764bce1cedbec68a1d02e95ee/packages/core/src/types.ts#L406)

Every legal `{ channel, type, payload, id }` as a *distinct* object type.

## Type Parameters

### EM

`EM` *extends* [`EventMapBase`](EventMapBase.md)

Event map.
