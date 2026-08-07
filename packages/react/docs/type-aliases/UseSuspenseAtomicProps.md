![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

[**@yoltra/react**](../README.md)

***

[@yoltra/react](../README.md) / UseSuspenseAtomicProps

# Type Alias: UseSuspenseAtomicProps()\<R, S\>

> **UseSuspenseAtomicProps**\<`R`, `S`\> = \{\<`R1`, `T`\>(`specs`, `options`): `T`; \<`R1`, `T`\>(`specs`, `options`): `T`; \}

Defined in: [react/src/hooks/suspense.ts:726](https://github.com/yoltra/yoltra/blob/main/packages/react/src/hooks/suspense.ts#L726)

Call signature for the typed `useSuspenseAtomicProps` returned by `createHooks`.

## Type Parameters

### R

`R` *extends* `string`

Reducer name union.

### S

`S` *extends* `Record`\<`R`, `any`\>

State record keyed by `R`.

## Call Signature

> \<`R1`, `T`\>(`specs`, `options`): `T`

### Type Parameters

#### R1

`R1` *extends* `string`

#### T

`T`

### Parameters

#### specs

`object`[]

#### options

[`SuspenseAtomicPropsOptions`](../interfaces/SuspenseAtomicPropsOptions.md)\<`T`, `S`\>

### Returns

`T`

## Call Signature

> \<`R1`, `T`\>(`specs`, `options`): `T`

### Type Parameters

#### R1

`R1` *extends* `string`

#### T

`T`

### Parameters

#### specs

`object`[]

#### options

[`SuspenseAtomicPropsOptions`](../interfaces/SuspenseAtomicPropsOptions.md)\<`T`, `S`\>

### Returns

`T`
