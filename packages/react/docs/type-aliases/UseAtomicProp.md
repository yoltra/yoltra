[**@yoltra/react**](../README.md)

***

[@yoltra/react](../README.md) / UseAtomicProp

# Type Alias: UseAtomicProp()\<R, S\>

> **UseAtomicProp**\<`R`, `S`\> = \{\<`R1`, `V`\>(`reducer`, `accessor`, `isEqual?`): `V`; \<`R1`, `P`\>(`spec`): [`PathValue`](PathValue.md)\<`S`\[`R1`\], `P`\>; \<`R1`, `P`, `T`\>(`spec`, `map`, `isEqual?`): `T`; \<`R1`, `P`, `T`\>(`spec`, `map`, `isEqual?`): `T`; \<`R1`\>(`spec`): `unknown`; \<`R1`, `T`\>(`spec`, `map`, `isEqual?`): `T`; \}

Defined in: [react/src/hooks/createHooks.ts:47](https://github.com/yoltra/yoltra/blob/ae94dea5790844eac37ee002f0fbed302029371e/packages/react/src/hooks/createHooks.ts#L47)

Call signature for the typed `useAtomicProp` hook returned by [createHooks](../functions/createHooks.md).

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

> \<`R1`, `V`\>(`reducer`, `accessor`, `isEqual?`): `V`

### Type Parameters

#### R1

`R1` *extends* `string`

#### V

`V`

### Parameters

#### reducer

`R1`

#### accessor

(`state`) => `V`

#### isEqual?

(`a`, `b`) => `boolean`

### Returns

`V`

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
const { useAtomicProp } = createHooks(AppStoreContext);

function TodoTitle({ index }: { index: number }) {
  const title = useAtomicProp({
    reducer: 'todos',
    property: `items.${index}.title`,
  });
  return <span>{title}</span>;
}
```
