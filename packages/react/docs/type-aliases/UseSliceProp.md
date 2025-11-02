[**@quojs/react**](../README.md)

***

[@quojs/react](../README.md) / UseSliceProp

# Type Alias: UseSliceProp()\<R, S\>

> **UseSliceProp**\<`R`, `S`\> = \{\<`R1`, `P`\>(`spec`): `PathValue`\<`S`\[`R1`\], `P`\>; \<`R1`, `P`, `T`\>(`spec`, `map`, `isEqual?`): `T`; \<`R1`, `P`, `T`\>(`spec`, `map`, `isEqual?`): `T`; \}

Defined in: [hooks/createQuoHooks.ts:24](https://github.com/quojs/quojs/blob/2d6b527415c15d6d74080cf0fe76f6103c5ec172/packages/react/src/hooks/createQuoHooks.ts#L24)

Overload shape for the `useSliceProp` hook returned by [createQuoHooks](../functions/createQuoHooks.md).
Exported so TypeDoc can include and cross-link it from factory docs.

## Type Parameters

### R

`R` *extends* `string`

Slice name union.

### S

`S` *extends* `Record`\<`R`, `any`\>

State record keyed by `R`.

## Call Signature

> \<`R1`, `P`\>(`spec`): `PathValue`\<`S`\[`R1`\], `P`\>

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

`PathValue`\<`S`\[`R1`\], `P`\>

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
