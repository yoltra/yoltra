![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

[**@yoltra/core**](../README.md)

***

[@yoltra/core](../README.md) / EMFromReducersStrict

# Type Alias: EMFromReducersStrict\<RM\>

> **EMFromReducersStrict**\<`RM`\> = `UnionToIntersection`\<`EMOfSpec`\<`RM`\[keyof `RM`\]\>\> *extends* infer Merged ? `Merged` *extends* [`EventMapBase`](EventMapBase.md) ? `Merged` : [`EventMapBase`](EventMapBase.md) : [`EventMapBase`](EventMapBase.md)

Defined in: [types.ts:1641](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L1641)

The event map a reducers map produces, merged across its slices.

## Type Parameters

### RM

`RM` *extends* [`ReducersMapAny`](ReducersMapAny.md)

## Remarks

This is the event map the `createStore` inference overload derives. Each slice contributes its
own event map, and those maps are **merged** (channels, and each channel's `type → payload`
entries, combined across slices) rather than collapsed to one slice's map, so a store whose
slices declare different event maps still types `emit` against every slice's channels and
types. Pair it with [StateFromReducers](StateFromReducers.md) to name both halves of an inferred store.
