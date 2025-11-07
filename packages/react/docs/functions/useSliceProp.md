[**@quojs/react**](../README.md)

***

[@quojs/react](../README.md) / useSliceProp

# ~~Function: useSliceProp()~~

## Call Signature

> **useSliceProp**\<`R`, `S`, `P`\>(`spec`): `PathValue`\<`S`\[`R`\], `P`\>

Defined in: [hooks/hooks.ts:294](https://github.com/quojs/quojs/blob/4b080313e808fe306ce36b57ad9b04440da9effc/packages/react/src/hooks/hooks.ts#L294)

### Type Parameters

#### R

`R` *extends* `string`

#### S

`S` *extends* `Record`\<`R`, `any`\>

#### P

`P` *extends* `string`

### Parameters

#### spec

##### property

`P`

##### reducer

`R`

### Returns

`PathValue`\<`S`\[`R`\], `P`\>

### Deprecated

Use [useAtomicProp](useAtomicProp.md) instead. Will be removed in `0.5.0`.
Fine-grained **single-path** selector for a Reducer.

## Call Signature

> **useSliceProp**\<`R`, `S`, `P`, `T`\>(`spec`, `map`, `isEqual?`): `T`

Defined in: [hooks/hooks.ts:297](https://github.com/quojs/quojs/blob/4b080313e808fe306ce36b57ad9b04440da9effc/packages/react/src/hooks/hooks.ts#L297)

### Type Parameters

#### R

`R` *extends* `string`

#### S

`S` *extends* `Record`\<`R`, `any`\>

#### P

`P` *extends* `string`

#### T

`T`

### Parameters

#### spec

##### property

`P`

##### reducer

`R`

#### map

(`value`) => `T`

#### isEqual?

(`a`, `b`) => `boolean`

### Returns

`T`

### Deprecated

Use [useAtomicProp](useAtomicProp.md) instead. Will be removed in `0.5.0`.
Fine-grained **single-path** selector for a Reducer.

## Call Signature

> **useSliceProp**\<`R`, `S`, `P`, `T`\>(`spec`, `map`, `isEqual?`): `T`

Defined in: [hooks/hooks.ts:302](https://github.com/quojs/quojs/blob/4b080313e808fe306ce36b57ad9b04440da9effc/packages/react/src/hooks/hooks.ts#L302)

### Type Parameters

#### R

`R` *extends* `string`

#### S

`S` *extends* `Record`\<`R`, `any`\>

#### P

`P` *extends* `string`

#### T

`T`

### Parameters

#### spec

##### property

`P`

##### reducer

`R`

#### map

(`value`) => `T`

#### isEqual?

(`a`, `b`) => `boolean`

### Returns

`T`

### Deprecated

Use [useAtomicProp](useAtomicProp.md) instead. Will be removed in `0.5.0`.
Fine-grained **single-path** selector for a Reducer.
