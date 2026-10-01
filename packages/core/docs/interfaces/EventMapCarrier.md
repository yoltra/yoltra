![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

[**@yoltra/core**](../README.md)

***

[@yoltra/core](../README.md) / EventMapCarrier

# Interface: EventMapCarrier\<EMAdd\>

Defined in: [types.ts:2119](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L2119)

Phantom carrier for the event map a spec contributes.

## Remarks

`EMAdd` cannot be inferred from a spec's `when`: `{ keys: [["chan", "evt"]] }` carries
channel and type strings and no payload types, so there is nothing to infer a map from. And
TypeScript has no partial type-argument inference, so a `registerSlice<N, St, EMAdd>` would
force a caller who names `EMAdd` to hand-write `N` and `St` too.

The way out is to put `EMAdd` in a **value** position, where inference works. The builders
([defineSlice](../functions/defineSlice.md), [defineMiddleware](../functions/defineMiddleware.md), [defineEffect](../functions/defineEffect.md)) brand a spec with this
interface, and the register methods read it back with [EMAddOf](../type-aliases/EMAddOf.md). Nothing exists at
runtime; the property is never assigned.

The property is **required, not optional**: an optional one makes
`X extends EventMapCarrier<infer E>` match every object and infer `unknown`. And it is a
*function* type so `EMAdd` sits in both co- and contravariant position, which keeps the
inference exact rather than widening to a supertype.

## Type Parameters

### EMAdd

`EMAdd` *extends* [`EventMapBase`](../type-aliases/EventMapBase.md)

## Properties

### ~yoltraEventMap()

> `readonly` **~yoltraEventMap**: (`em`) => `EMAdd`

Defined in: [types.ts:2121](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L2121)

Phantom. Never present at runtime, and never read.

#### Parameters

##### em

`EMAdd`

#### Returns

`EMAdd`
