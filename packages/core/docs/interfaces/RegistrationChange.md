![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

[**@yoltra/core**](../README.md)

***

[@yoltra/core](../README.md) / RegistrationChange

# Interface: RegistrationChange\<EM\>

Defined in: [types.ts:2135](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L2135)

One change to a store's registrations.

## Remarks

Self-sufficient on purpose: an observer should never need a follow-up
`__devtoolsIntrospect()` call to act on what it was told.

## Type Parameters

### EM

`EM` *extends* [`EventMapBase`](../type-aliases/EventMapBase.md) = [`EventMapBase`](../type-aliases/EventMapBase.md)

## Properties

### description?

> `readonly` `optional` **description**: `string`

Defined in: [types.ts:2143](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L2143)

***

### dispatch?

> `readonly` `optional` **dispatch**: `"keyed"` \| `"pattern"`

Defined in: [types.ts:2164](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L2164)

Whether this registration is dispatched by key (O(1)) or by runtime matching.

***

### kind

> `readonly` **kind**: `"reducer"` \| `"middleware"` \| `"effect"`

Defined in: [types.ts:2136](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L2136)

***

### name?

> `readonly` `optional` **name**: `string`

Defined in: [types.ts:2139](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L2139)

Slice name for a reducer; `meta.name` for middleware and effects; absent when unnamed.

***

### op

> `readonly` **op**: `"mounted"` \| `"unmounted"`

Defined in: [types.ts:2137](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L2137)

***

### origin

> `readonly` **origin**: [`Origin`](../type-aliases/Origin.md)

Defined in: [types.ts:2140](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L2140)

***

### owner?

> `readonly` `optional` **owner**: `string`

Defined in: [types.ts:2142](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L2142)

Introspection only, and only ever what a library passed.

***

### state?

> `readonly` `optional` **state**: `"initialized"` \| `"preserved"` \| `"deleted"` \| `"retained"`

Defined in: [types.ts:2162](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L2162)

Reducers only: what happened to the slice's state.

#### Remarks

Four values, and the fourth is the one that matters. `replaceReducers` updates an
existing slice by unmounting it with its state intact and remounting, so an observer
treating every `"unmounted"` as destruction would tear down a subscription it is about
to need. `"retained"` says the state survived; `"deleted"` says it did not.

***

### when?

> `readonly` `optional` **when**: [`When`](../type-aliases/When.md)\<`EM`\>

Defined in: [types.ts:2152](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L2152)

The **normalized** matcher, as `matchesWhen` will actually use it.

#### Remarks

Not the raw spec's `when`. `registerEffect` normalizes three ways, including turning no
targeting at all into `{ any: true }`, so handing back the raw form would describe
something other than what will fire.
