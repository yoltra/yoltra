[**@quojs/react**](../README.md)

***

[@quojs/react](../README.md) / UseAtomicProp

# Type Alias: UseAtomicProp()\<R, S\>

> **UseAtomicProp**\<`R`, `S`\> = \{\<`R1`, `P`\>(`spec`): [`PathValue`](PathValue.md)\<`S`\[`R1`\], `P`\>; \<`R1`, `P`, `T`\>(`spec`, `map`, `isEqual?`): `T`; \<`R1`, `P`, `T`\>(`spec`, `map`, `isEqual?`): `T`; \<`R1`\>(`spec`): `unknown`; \<`R1`, `T`\>(`spec`, `map`, `isEqual?`): `T`; \}

Defined in: [hooks/createQuoHooks.ts:18](https://github.com/quojs/quojs/blob/74de3d2d0ff0336e38f1bb850c2a97571cea3f88/packages/react/src/hooks/createQuoHooks.ts#L18)

## Type Parameters

### R

`R` *extends* `string`

### S

`S` *extends* `Record`\<`R`, `any`\>

## Call Signature

> \<`R1`, `P`\>(`spec`): [`PathValue`](PathValue.md)\<`S`\[`R1`\], `P`\>

### Type Parameters

#### R1

`R1` *extends* `string`

#### P

`P` *extends* `string`

### Parameters

#### spec

##### property

`P`

##### reducer

`R1`

### Returns

[`PathValue`](PathValue.md)\<`S`\[`R1`\], `P`\>

## Call Signature

> \<`R1`, `P`, `T`\>(`spec`, `map`, `isEqual?`): `T`

### Type Parameters

#### R1

`R1` *extends* `string`

#### P

`P` *extends* `string`

#### T

`T`

### Parameters

#### spec

##### property

`P`

##### reducer

`R1`

#### map

(`value`) => `T`

#### isEqual?

(`a`, `b`) => `boolean`

### Returns

`T`

## Call Signature

> \<`R1`, `P`, `T`\>(`spec`, `map`, `isEqual?`): `T`

### Type Parameters

#### R1

`R1` *extends* `string`

#### P

`P` *extends* `string`

#### T

`T`

### Parameters

#### spec

##### property

`P`

##### reducer

`R1`

#### map

(`value`) => `T`

#### isEqual?

(`a`, `b`) => `boolean`

### Returns

`T`

## Call Signature

> \<`R1`\>(`spec`): `unknown`

### Type Parameters

#### R1

`R1` *extends* `string`

### Parameters

#### spec

##### property

`string`

##### reducer

`R1`

### Returns

`unknown`

## Call Signature

> \<`R1`, `T`\>(`spec`, `map`, `isEqual?`): `T`

### Type Parameters

#### R1

`R1` *extends* `string`

#### T

`T`

### Parameters

#### spec

##### property

`string`

##### reducer

`R1`

#### map

(`value`) => `T`

#### isEqual?

(`a`, `b`) => `boolean`

### Returns

`T`
