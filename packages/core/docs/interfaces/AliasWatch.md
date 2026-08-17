![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

[**@yoltra/core**](../README.md)

***

[@yoltra/core](../README.md) / AliasWatch

# Interface: AliasWatch

Defined in: [utils/immutability.ts:109](https://github.com/yoltra/yoltra/blob/main/packages/core/src/utils/immutability.ts#L109)

Watches the freeze walk for one specific reference.

## Remarks

Exists to turn a dev-only heisenbug into a named warning. Because the freeze is deep and
in place, anything a reducer stores **by reference** is frozen too — the event payload, a
module-level default, a cached response. Mutating that object afterwards then throws, only in
development, from a stack that has nothing to do with the store, and the same code works in
production because the freeze is compiled out.

Freezing it is not the mistake: an object reachable from state genuinely must not be mutated,
or state changes behind the store's back. Keeping the reference is. The walk already visits
every node, so recognising one of them costs an identity comparison and lets the store say so
at the moment it happens.

## Properties

### onFound()

> `readonly` **onFound**: () => `void`

Defined in: [utils/immutability.ts:113](https://github.com/yoltra/yoltra/blob/main/packages/core/src/utils/immutability.ts#L113)

Called if `watch` is reachable from the value being frozen.

#### Returns

`void`

***

### watch

> `readonly` **watch**: `object`

Defined in: [utils/immutability.ts:111](https://github.com/yoltra/yoltra/blob/main/packages/core/src/utils/immutability.ts#L111)

The reference to look for while freezing.
