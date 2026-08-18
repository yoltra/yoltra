![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

[**@yoltra/react**](../README.md)

***

[@yoltra/react](../README.md) / SuspenseCache

# Interface: SuspenseCache

Defined in: [react/src/hooks/suspense.ts:114](https://github.com/yoltra/yoltra/blob/main/packages/react/src/hooks/suspense.ts#L114)

Backing store for the `useSuspense*` hooks.

## Remarks

Documented because [suspenseCache](../variables/suspenseCache.md) exports an instance of it: a type reachable
through a published value is part of the surface whether or not it was meant to be.
Its internals stay private; what is documented is what a consumer can actually call.

## Accessors

### size

#### Get Signature

> **get** **size**(): `number`

Defined in: [react/src/hooks/suspense.ts:150](https://github.com/yoltra/yoltra/blob/main/packages/react/src/hooks/suspense.ts#L150)

Number of entries currently held.

##### Returns

`number`

## Methods

### clear()

> **clear**(): `void`

Defined in: [react/src/hooks/suspense.ts:250](https://github.com/yoltra/yoltra/blob/main/packages/react/src/hooks/suspense.ts#L250)

#### Returns

`void`

***

### invalidate()

> **invalidate**(`key`): `void`

Defined in: [react/src/hooks/suspense.ts:212](https://github.com/yoltra/yoltra/blob/main/packages/react/src/hooks/suspense.ts#L212)

#### Parameters

##### key

`string`

#### Returns

`void`

***

### read()

> **read**\<`T`\>(`key`, `load`, `staleTime`, `errorTtlMs`): `T`

Defined in: [react/src/hooks/suspense.ts:154](https://github.com/yoltra/yoltra/blob/main/packages/react/src/hooks/suspense.ts#L154)

#### Type Parameters

##### T

`T`

#### Parameters

##### key

`string`

##### load

() => `T` \| `Promise`\<`T`\>

##### staleTime

`null` | `number`

##### errorTtlMs

`undefined` | `null` | `number`

#### Returns

`T`
