[**@quojs/react**](../README.md)

***

[@quojs/react](../README.md) / UseAtomicProps

# Type Alias: UseAtomicProps()\<R, S\>

> **UseAtomicProps**\<`R`, `S`\> = \{\<`R1`, `T`\>(`specs`, `selector`, `isEqual?`): `T`; \<`R1`, `T`\>(`specs`, `selector`, `isEqual?`): `T`; \}

Defined in: [hooks/createQuoHooks.ts:43](https://github.com/quojs/quojs/blob/3a7e48ef6dc2bf6db713ff04100a2a0e1ee72ff5/packages/react/src/hooks/createQuoHooks.ts#L43)

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
