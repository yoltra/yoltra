![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

[**@yoltra/core**](../README.md)

***

[@yoltra/core](../README.md) / RegistrationChange

# Interface: RegistrationChange\<EM\>

Defined in: [types.ts:1921](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L1921)

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

Defined in: [types.ts:1929](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L1929)

***

### dispatch?

> `readonly` `optional` **dispatch**: `"keyed"` \| `"pattern"`

Defined in: [types.ts:1950](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L1950)

Whether this registration is dispatched by key (O(1)) or by runtime matching.

***

### kind

> `readonly` **kind**: `"reducer"` \| `"middleware"` \| `"effect"`

Defined in: [types.ts:1922](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L1922)

***

### name?

> `readonly` `optional` **name**: `string`

Defined in: [types.ts:1925](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L1925)

Slice name for a reducer; `meta.name` for middleware and effects; absent when unnamed.

***

### op

> `readonly` **op**: `"mounted"` \| `"unmounted"`

Defined in: [types.ts:1923](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L1923)

***

### origin

> `readonly` **origin**: [`Origin`](../type-aliases/Origin.md)

Defined in: [types.ts:1926](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L1926)

***

### owner?

> `readonly` `optional` **owner**: `string`

Defined in: [types.ts:1928](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L1928)

Introspection only, and only ever what a library passed.

***

### state?

> `readonly` `optional` **state**: `"initialized"` \| `"preserved"` \| `"deleted"` \| `"retained"`

Defined in: [types.ts:1948](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L1948)

Reducers only: what happened to the slice's state.

#### Remarks

Four values, and the fourth is the one that matters. `replaceReducers` updates an
existing slice by unmounting it with its state intact and remounting, so an observer
treating every `"unmounted"` as destruction would tear down a subscription it is about
to need. `"retained"` says the state survived; `"deleted"` says it did not.

***

### when?

> `readonly` `optional` **when**: [`When`](../type-aliases/When.md)\<`EM`\>

Defined in: [types.ts:1938](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L1938)

The **normalized** matcher, as `matchesWhen` will actually use it.

#### Remarks

Not the raw spec's `when`. `registerEffect` normalizes three ways, including turning no
targeting at all into `{ any: true }`, so handing back the raw form would describe
something other than what will fire.
