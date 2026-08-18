![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

[**@yoltra/core**](../README.md)

***

[@yoltra/core](../README.md) / CascadeInfo

# Interface: CascadeInfo\<EM\>

Defined in: [types.ts:655](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L655)

What [StoreSpec.onCascade](../type-aliases/StoreSpec.md#oncascade) receives when a ceiling is breached.

## Type Parameters

### EM

`EM` *extends* [`EventMapBase`](../type-aliases/EventMapBase.md) = [`EventMapBase`](../type-aliases/EventMapBase.md)

Event map.

## Properties

### chain

> `readonly` **chain**: readonly `string`[]

Defined in: [types.ts:671](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L671)

Ids from the root of the chain to the refused event's parent, newest last.

#### Remarks

Bounded to the most recent entries: a cascade is long by definition, and the useful part is
the cycle at the end rather than the thousand identical hops before it.

***

### depth

> `readonly` **depth**: `number`

Defined in: [types.ts:663](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L663)

Causal depth the refused event would have had.

***

### event

> `readonly` **event**: [`EventUnion`](../type-aliases/EventUnion.md)\<`EM`\>

Defined in: [types.ts:661](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L661)

The event that was refused — the one that would have extended the chain.

***

### limit

> `readonly` **limit**: `"maxReduceDepth"` \| `"maxTransitionsPerDrain"`

Defined in: [types.ts:657](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L657)

Which ceiling was hit.

***

### limitValue

> `readonly` **limitValue**: `number`

Defined in: [types.ts:659](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L659)

The configured value that was exceeded.
