![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

[**@yoltra/core**](../README.md)

***

[@yoltra/core](../README.md) / CascadeInfo

# Interface: CascadeInfo\<EM\>

Defined in: [types.ts:1019](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L1019)

What [StoreSpec.onCascade](../type-aliases/StoreSpec.md#oncascade) receives when a ceiling is breached.

## Type Parameters

### EM

`EM` *extends* [`EventMapBase`](../type-aliases/EventMapBase.md) = [`EventMapBase`](../type-aliases/EventMapBase.md)

Event map.

## Properties

### chain

> `readonly` **chain**: readonly `string`[]

Defined in: [types.ts:1035](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L1035)

Ids from the root of the chain to the refused event's parent, newest last.

#### Remarks

Bounded to the most recent entries: a cascade is long by definition, and the useful part is
the cycle at the end rather than the thousand identical hops before it.

***

### depth

> `readonly` **depth**: `number`

Defined in: [types.ts:1027](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L1027)

Causal depth the refused event would have had.

***

### event

> `readonly` **event**: [`EventUnion`](../type-aliases/EventUnion.md)\<`EM`\>

Defined in: [types.ts:1025](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L1025)

The event that was refused — the one that would have extended the chain.

***

### limit

> `readonly` **limit**: `"maxReduceDepth"` \| `"maxTransitionsPerDrain"`

Defined in: [types.ts:1021](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L1021)

Which ceiling was hit.

***

### limitValue

> `readonly` **limitValue**: `number`

Defined in: [types.ts:1023](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L1023)

The configured value that was exceeded.
