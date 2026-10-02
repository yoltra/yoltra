![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

[**@yoltra/react**](../README.md)

***

[@yoltra/react](../README.md) / SuspenseCache

# Interface: SuspenseCache

Defined in: [react/src/hooks/suspense.ts:137](https://github.com/yoltra/yoltra/blob/main/packages/react/src/hooks/suspense.ts#L137)

Backing store for the `useSuspense*` hooks.

## Remarks

Documented because [suspenseCache](../variables/suspenseCache.md) exports an instance of it: a type reachable
through a published value is part of the surface whether or not it was meant to be.
Its internals stay private; what is documented is what a consumer can actually call.

## Accessors

### size

#### Get Signature

> **get** **size**(): `number`

Defined in: [react/src/hooks/suspense.ts:173](https://github.com/yoltra/yoltra/blob/main/packages/react/src/hooks/suspense.ts#L173)

Number of entries currently held.

##### Returns

`number`

## Methods

### clear()

> **clear**(): `void`

Defined in: [react/src/hooks/suspense.ts:299](https://github.com/yoltra/yoltra/blob/main/packages/react/src/hooks/suspense.ts#L299)

#### Returns

`void`

***

### invalidate()

> **invalidate**(`key`): `void`

Defined in: [react/src/hooks/suspense.ts:261](https://github.com/yoltra/yoltra/blob/main/packages/react/src/hooks/suspense.ts#L261)

#### Parameters

##### key

`string`

#### Returns

`void`

***

### read()

> **read**\<`T`\>(`key`, `load`, `staleTime`, `errorTtlMs`, `source?`): `T`

Defined in: [react/src/hooks/suspense.ts:185](https://github.com/yoltra/yoltra/blob/main/packages/react/src/hooks/suspense.ts#L185)

Returns the value cached under `key`, or starts `load` and throws its promise.

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

##### source?

readonly `unknown`[]

The state values the load reads, compared element by element with
  `Object.is`. An entry loaded from different values is discarded and loaded again, so a
  read always describes the current state even when an invalidation was missed. Omit it to
  rely on invalidation alone.

#### Returns

`T`
