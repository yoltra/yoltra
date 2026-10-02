![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

[**@yoltra/core**](../README.md)

***

[@yoltra/core](../README.md) / AliasWatch

# Interface: AliasWatch

Defined in: [utils/immutability.ts:119](https://github.com/yoltra/yoltra/blob/main/packages/core/src/utils/immutability.ts#L119)

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

### also?

> `readonly` `optional` **also**: `ReadonlySet`\<`object`\>

Defined in: [utils/immutability.ts:129](https://github.com/yoltra/yoltra/blob/main/packages/core/src/utils/immutability.ts#L129)

Further references to look for, such as binary values held one level inside `watch`.

#### Remarks

A reducer that copies the payload object but keeps its buffer, `{ ...payload }`, stores the
buffer by reference without storing `watch`. Listing such values here reports that too.

***

### onFound()

> `readonly` **onFound**: (`node`) => `void`

Defined in: [utils/immutability.ts:131](https://github.com/yoltra/yoltra/blob/main/packages/core/src/utils/immutability.ts#L131)

Called with the reference found, `watch` or one of `also`, when it is reachable from the value being frozen.

#### Parameters

##### node

`object`

#### Returns

`void`

***

### watch

> `readonly` **watch**: `object`

Defined in: [utils/immutability.ts:121](https://github.com/yoltra/yoltra/blob/main/packages/core/src/utils/immutability.ts#L121)

The reference to look for while freezing.
