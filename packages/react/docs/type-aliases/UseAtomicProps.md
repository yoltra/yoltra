[**@quojs/react**](../README.md)

***

[@quojs/react](../README.md) / UseAtomicProps

# Type Alias: UseAtomicProps()\<R, S\>

> **UseAtomicProps**\<`R`, `S`\> = \{\<`R1`, `T`\>(`specs`, `selector`, `isEqual?`): `T`; \<`R1`, `T`\>(`specs`, `selector`, `isEqual?`): `T`; \}

Defined in: [react/src/hooks/createQuoHooks.ts:42](https://github.com/quojs/quojs/blob/90b047cd5df060b28c5f76a1ad4792631061e571/packages/react/src/hooks/createQuoHooks.ts#L42)

## Type Parameters

### R

`R` *extends* `string`

### S

`S` *extends* `Record`\<`R`, `any`\>

## Call Signature

> \<`R1`, `T`\>(`specs`, `selector`, `isEqual?`): `T`

### Type Parameters

#### R1

`R1` *extends* `string`

#### T

`T`

### Parameters

#### specs

`object`[]

#### selector

(`state`) => `T`

#### isEqual?

(`a`, `b`) => `boolean`

### Returns

`T`

## Call Signature

> \<`R1`, `T`\>(`specs`, `selector`, `isEqual?`): `T`

### Type Parameters

#### R1

`R1` *extends* `string`

#### T

`T`

### Parameters

#### specs

`object`[]

#### selector

(`state`) => `T`

#### isEqual?

(`a`, `b`) => `boolean`

### Returns

`T`
