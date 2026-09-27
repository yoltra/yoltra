![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

[**@yoltra/core**](../README.md)

***

[@yoltra/core](../README.md) / RegistrationChange

# Interface: RegistrationChange\<EM\>

Defined in: [types.ts:1835](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L1835)

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

Defined in: [types.ts:1843](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L1843)

***

### dispatch?

> `readonly` `optional` **dispatch**: `"keyed"` \| `"pattern"`

Defined in: [types.ts:1864](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L1864)

Whether this registration is dispatched by key (O(1)) or by runtime matching.

***

### kind

> `readonly` **kind**: `"reducer"` \| `"middleware"` \| `"effect"`

Defined in: [types.ts:1836](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L1836)

***

### name?

> `readonly` `optional` **name**: `string`

Defined in: [types.ts:1839](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L1839)

Slice name for a reducer; `meta.name` for middleware and effects; absent when unnamed.

***

### op

> `readonly` **op**: `"mounted"` \| `"unmounted"`

Defined in: [types.ts:1837](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L1837)

***

### origin

> `readonly` **origin**: [`Origin`](../type-aliases/Origin.md)

Defined in: [types.ts:1840](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L1840)

***

### owner?

> `readonly` `optional` **owner**: `string`

Defined in: [types.ts:1842](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L1842)

Introspection only, and only ever what a library passed.

***

### state?

> `readonly` `optional` **state**: `"initialized"` \| `"preserved"` \| `"deleted"` \| `"retained"`

Defined in: [types.ts:1862](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L1862)

Reducers only: what happened to the slice's state.

#### Remarks

Four values, and the fourth is the one that matters. `replaceReducers` updates an
existing slice by unmounting it with its state intact and remounting, so an observer
treating every `"unmounted"` as destruction would tear down a subscription it is about
to need. `"retained"` says the state survived; `"deleted"` says it did not.

***

### when?

> `readonly` `optional` **when**: [`When`](../type-aliases/When.md)\<`EM`\>

Defined in: [types.ts:1852](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L1852)

The **normalized** matcher, as `matchesWhen` will actually use it.

#### Remarks

Not the raw spec's `when`. `registerEffect` normalizes three ways, including turning no
targeting at all into `{ any: true }`, so handing back the raw form would describe
something other than what will fire.
