![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

[**@yoltra/core**](../README.md)

***

[@yoltra/core](../README.md) / RegistrationChange

# Interface: RegistrationChange\<EM\>

Defined in: [types.ts:1948](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L1948)

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

Defined in: [types.ts:1956](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L1956)

***

### dispatch?

> `readonly` `optional` **dispatch**: `"keyed"` \| `"pattern"`

Defined in: [types.ts:1977](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L1977)

Whether this registration is dispatched by key (O(1)) or by runtime matching.

***

### kind

> `readonly` **kind**: `"reducer"` \| `"middleware"` \| `"effect"`

Defined in: [types.ts:1949](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L1949)

***

### name?

> `readonly` `optional` **name**: `string`

Defined in: [types.ts:1952](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L1952)

Slice name for a reducer; `meta.name` for middleware and effects; absent when unnamed.

***

### op

> `readonly` **op**: `"mounted"` \| `"unmounted"`

Defined in: [types.ts:1950](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L1950)

***

### origin

> `readonly` **origin**: [`Origin`](../type-aliases/Origin.md)

Defined in: [types.ts:1953](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L1953)

***

### owner?

> `readonly` `optional` **owner**: `string`

Defined in: [types.ts:1955](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L1955)

Introspection only, and only ever what a library passed.

***

### state?

> `readonly` `optional` **state**: `"initialized"` \| `"preserved"` \| `"deleted"` \| `"retained"`

Defined in: [types.ts:1975](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L1975)

Reducers only: what happened to the slice's state.

#### Remarks

Four values, and the fourth is the one that matters. `replaceReducers` updates an
existing slice by unmounting it with its state intact and remounting, so an observer
treating every `"unmounted"` as destruction would tear down a subscription it is about
to need. `"retained"` says the state survived; `"deleted"` says it did not.

***

### when?

> `readonly` `optional` **when**: [`When`](../type-aliases/When.md)\<`EM`\>

Defined in: [types.ts:1965](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L1965)

The **normalized** matcher, as `matchesWhen` will actually use it.

#### Remarks

Not the raw spec's `when`. `registerEffect` normalizes three ways, including turning no
targeting at all into `{ any: true }`, so handing back the raw form would describe
something other than what will fire.
