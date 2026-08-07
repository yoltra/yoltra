![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

[**@yoltra/react**](../README.md)

***

[@yoltra/react](../README.md) / UseSuspenseAtomicProp

# Type Alias: UseSuspenseAtomicProp()\<R, S\>

> **UseSuspenseAtomicProp**\<`R`, `S`\> = \{\<`R1`, `P`, `T`\>(`storeSpec`, `options`): `T`; \<`R1`, `T`\>(`storeSpec`, `options`): `T`; \}

Defined in: [react/src/hooks/suspense.ts:707](https://github.com/yoltra/yoltra/blob/main/packages/react/src/hooks/suspense.ts#L707)

Call signature for the typed `useSuspenseAtomicProp` returned by `createHooks`.

Identical in behaviour to the package-level useSuspenseAtomicProp; the reducer union
and state shape are fixed by the store the hooks were created for, so neither has to be
supplied at the call site.

## Type Parameters

### R

`R` *extends* `string`

Reducer name union.

### S

`S` *extends* `Record`\<`R`, `any`\>

State record keyed by `R`.

## Call Signature

> \<`R1`, `P`, `T`\>(`storeSpec`, `options`): `T`

### Type Parameters

#### R1

`R1` *extends* `string`

#### P

`P` *extends* `string`

#### T

`T`

### Parameters

#### storeSpec

##### property

`P`

##### reducer

`R1`

#### options

[`SuspenseAtomicPropOptions`](../interfaces/SuspenseAtomicPropOptions.md)\<`T`, `S`\>

### Returns

`T`

## Call Signature

> \<`R1`, `T`\>(`storeSpec`, `options`): `T`

### Type Parameters

#### R1

`R1` *extends* `string`

#### T

`T`

### Parameters

#### storeSpec

##### property

`string`

##### reducer

`R1`

#### options

[`SuspenseAtomicPropOptions`](../interfaces/SuspenseAtomicPropOptions.md)\<`T`, `S`\>

### Returns

`T`
