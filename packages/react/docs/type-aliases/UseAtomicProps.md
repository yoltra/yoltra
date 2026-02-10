[**@quojs/react**](../README.md)

***

[@quojs/react](../README.md) / UseAtomicProps

# Type Alias: UseAtomicProps()\<R, S\>

> **UseAtomicProps**\<`R`, `S`\> = \{\<`R1`, `T`\>(`specs`, `selector`, `isEqual?`): `T`; \<`R1`, `T`\>(`specs`, `selector`, `isEqual?`): `T`; \}

Defined in: [react/src/hooks/createQuoHooks.ts:95](https://github.com/quojs/quojs/blob/7a847d68175722f00e52941458a1511185cf0a4e/packages/react/src/hooks/createQuoHooks.ts#L95)

Call signature for the typed `useAtomicProps` hook returned by [createQuoHooks](../functions/createQuoHooks.md).

Subscribes to multiple dotted paths across one or more reducers and recomputes
a derived value when any of them change.

## Type Parameters

### R

`R` *extends* `string`

Reducer name union.

### S

`S` *extends* `Record`\<`R`, `any`\>

State record keyed by `R`.

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

## Example

```tsx
const { useAtomicProps } = createQuoHooks(AppStoreContext);

function FilteredCount() {
  const count = useAtomicProps(
    [
      { reducer: 'todos', property: 'items.**' },
      { reducer: 'filter', property: 'q' },
    ],
    (s) => s.todos.items.filter(x => x.title.includes(s.filter.q)).length,
  );
  return <span>{count}</span>;
}
```
