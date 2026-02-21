[**@yoltra/react**](../README.md)

***

[@yoltra/react](../README.md) / UseAtomicProp

# Type Alias: UseAtomicProp()\<R, S\>

> **UseAtomicProp**\<`R`, `S`\> = \{\<`R1`, `P`\>(`spec`): [`PathValue`](PathValue.md)\<`S`\[`R1`\], `P`\>; \<`R1`, `P`, `T`\>(`spec`, `map`, `isEqual?`): `T`; \<`R1`, `P`, `T`\>(`spec`, `map`, `isEqual?`): `T`; \<`R1`\>(`spec`): `unknown`; \<`R1`, `T`\>(`spec`, `map`, `isEqual?`): `T`; \}

Defined in: [react/src/hooks/createQuoHooks.ts:45](https://github.com/yoltra/yoltra/blob/7bf784f9e7daaf114608ff30306ac3400da926ed/packages/react/src/hooks/createQuoHooks.ts#L45)

Call signature for the typed `useAtomicProp` hook returned by [createQuoHooks](../functions/createQuoHooks.md).

Subscribes to a specific dotted path in a reducer's state and re-renders
only when that path changes. All type parameters are inferred automatically
from the store context — no explicit generics needed.

## Type Parameters

### R

`R` *extends* `string`

Reducer name union.

### S

`S` *extends* `Record`\<`R`, `any`\>

State record keyed by `R`.

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

## Example

```tsx
const { useAtomicProp } = createQuoHooks(AppStoreContext);

function TodoTitle({ index }: { index: number }) {
  const title = useAtomicProp({
    reducer: 'todos',
    property: `items.${index}.title`,
  });
  return <span>{title}</span>;
}
```
