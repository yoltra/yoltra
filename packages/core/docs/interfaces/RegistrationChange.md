![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

[**@yoltra/core**](../README.md)

***

[@yoltra/core](../README.md) / RegistrationChange

# Interface: RegistrationChange\<EM\>

Defined in: [types.ts:1817](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L1817)

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

Defined in: [types.ts:1825](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L1825)

***

### dispatch?

> `readonly` `optional` **dispatch**: `"keyed"` \| `"pattern"`

Defined in: [types.ts:1846](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L1846)

Whether this registration is dispatched by key (O(1)) or by runtime matching.

***

### kind

> `readonly` **kind**: `"reducer"` \| `"middleware"` \| `"effect"`

Defined in: [types.ts:1818](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L1818)

***

### name?

> `readonly` `optional` **name**: `string`

Defined in: [types.ts:1821](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L1821)

Slice name for a reducer; `meta.name` for middleware and effects; absent when unnamed.

***

### op

> `readonly` **op**: `"mounted"` \| `"unmounted"`

Defined in: [types.ts:1819](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L1819)

***

### origin

> `readonly` **origin**: [`Origin`](../type-aliases/Origin.md)

Defined in: [types.ts:1822](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L1822)

***

### owner?

> `readonly` `optional` **owner**: `string`

Defined in: [types.ts:1824](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L1824)

Introspection only, and only ever what a library passed.

***

### state?

> `readonly` `optional` **state**: `"initialized"` \| `"preserved"` \| `"deleted"` \| `"retained"`

Defined in: [types.ts:1844](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L1844)

Reducers only: what happened to the slice's state.

#### Remarks

Four values, and the fourth is the one that matters. `replaceReducers` updates an
existing slice by unmounting it with its state intact and remounting, so an observer
treating every `"unmounted"` as destruction would tear down a subscription it is about
to need. `"retained"` says the state survived; `"deleted"` says it did not.

***

### when?

> `readonly` `optional` **when**: [`When`](../type-aliases/When.md)\<`EM`\>

Defined in: [types.ts:1834](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L1834)

The **normalized** matcher, as `matchesWhen` will actually use it.

#### Remarks

Not the raw spec's `when`. `registerEffect` normalizes three ways, including turning no
targeting at all into `{ any: true }`, so handing back the raw form would describe
something other than what will fire.
