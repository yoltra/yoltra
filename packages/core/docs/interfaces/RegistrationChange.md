![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

[**@yoltra/core**](../README.md)

***

[@yoltra/core](../README.md) / RegistrationChange

# Interface: RegistrationChange\<EM\>

Defined in: [types.ts:1711](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L1711)

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

Defined in: [types.ts:1719](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L1719)

***

### dispatch?

> `readonly` `optional` **dispatch**: `"keyed"` \| `"pattern"`

Defined in: [types.ts:1740](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L1740)

Whether this registration is dispatched by key (O(1)) or by runtime matching.

***

### kind

> `readonly` **kind**: `"reducer"` \| `"middleware"` \| `"effect"`

Defined in: [types.ts:1712](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L1712)

***

### name?

> `readonly` `optional` **name**: `string`

Defined in: [types.ts:1715](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L1715)

Slice name for a reducer; `meta.name` for middleware and effects; absent when unnamed.

***

### op

> `readonly` **op**: `"mounted"` \| `"unmounted"`

Defined in: [types.ts:1713](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L1713)

***

### origin

> `readonly` **origin**: [`Origin`](../type-aliases/Origin.md)

Defined in: [types.ts:1716](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L1716)

***

### owner?

> `readonly` `optional` **owner**: `string`

Defined in: [types.ts:1718](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L1718)

Introspection only, and only ever what a library passed.

***

### state?

> `readonly` `optional` **state**: `"initialized"` \| `"preserved"` \| `"deleted"` \| `"retained"`

Defined in: [types.ts:1738](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L1738)

Reducers only: what happened to the slice's state.

#### Remarks

Four values, and the fourth is the one that matters. `replaceReducers` updates an
existing slice by unmounting it with its state intact and remounting, so an observer
treating every `"unmounted"` as destruction would tear down a subscription it is about
to need. `"retained"` says the state survived; `"deleted"` says it did not.

***

### when?

> `readonly` `optional` **when**: [`When`](../type-aliases/When.md)\<`EM`\>

Defined in: [types.ts:1728](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L1728)

The **normalized** matcher, as `matchesWhen` will actually use it.

#### Remarks

Not the raw spec's `when`. `registerEffect` normalizes three ways, including turning no
targeting at all into `{ any: true }`, so handing back the raw form would describe
something other than what will fire.
