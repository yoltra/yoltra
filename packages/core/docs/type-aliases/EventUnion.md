[**@quojs/core**](../README.md)

***

[@quojs/core](../README.md) / EventUnion

# Type Alias: EventUnion\<EM\>

> **EventUnion**\<`EM`\> = `{ [C in keyof EM]: { [T in keyof EM[C]]: Event<EM, C, T> }[keyof EM[C]] }`\[keyof `EM`\]

Defined in: [types.ts:418](https://github.com/quojs/quojs/blob/74de3d2d0ff0336e38f1bb850c2a97571cea3f88/packages/core/src/types.ts#L418)

Every legal `{ channel, type, payload, id }` as a *distinct* object type.

## Type Parameters

### EM

`EM` *extends* [`EventMapBase`](EventMapBase.md)

Event map.
