[**@quojs/react**](../README.md)

***

[@quojs/react](../README.md) / useAtomicProps

# Function: useAtomicProps()

## Call Signature

> **useAtomicProps**\<`R`, `S`, `T`\>(`specs`, `selector`, `isEqual?`): `T`

Defined in: [react/src/hooks/hooks.ts:371](https://github.com/quojs/quojs/blob/90b047cd5df060b28c5f76a1ad4792631061e571/packages/react/src/hooks/hooks.ts#L371)

**Multi-path** fine-grained selector.

Subscribes to several `reducer.property` paths (supports deep & wildcard)
and recomputes `selector(state)` when any of them change.

### Type Parameters

#### R

`R` *extends* `string`

Slice name union.

#### S

`S` *extends* `Record`\<`R`, `any`\>

State record keyed by `R`.

#### T

`T`

Derived value type.

### Parameters

#### specs

`object`[]

Array of `{ reducer, property }`, where `property` can be a string or array of strings. Supports `*`/`**`.

#### selector

(`state`) => `T`

`(state) => T` function run against the full state.

#### isEqual?

(`a`, `b`) => `boolean`

Equality comparator for the derived value (defaults to `Object.is`).

### Returns

`T`

### Example

```tsx
const total = useAtomicProps<'todos' | 'filter', AppState, number>(
  [
    { reducer: 'todos',  property: 'items.**' },
    { reducer: 'filter', property: 'q' }
  ],
  (s) => s.todos.items.filter(x => x.title.includes(s.filter.q)).length
);
```

## Call Signature

> **useAtomicProps**\<`R`, `S`, `T`\>(`specs`, `selector`, `isEqual?`): `T`

Defined in: [react/src/hooks/hooks.ts:376](https://github.com/quojs/quojs/blob/90b047cd5df060b28c5f76a1ad4792631061e571/packages/react/src/hooks/hooks.ts#L376)

**Multi-path** fine-grained selector.

Subscribes to several `reducer.property` paths (supports deep & wildcard)
and recomputes `selector(state)` when any of them change.

### Type Parameters

#### R

`R` *extends* `string`

Slice name union.

#### S

`S` *extends* `Record`\<`R`, `any`\>

State record keyed by `R`.

#### T

`T`

Derived value type.

### Parameters

#### specs

`object`[]

Array of `{ reducer, property }`, where `property` can be a string or array of strings. Supports `*`/`**`.

#### selector

(`state`) => `T`

`(state) => T` function run against the full state.

#### isEqual?

(`a`, `b`) => `boolean`

Equality comparator for the derived value (defaults to `Object.is`).

### Returns

`T`

### Example

```tsx
const total = useAtomicProps<'todos' | 'filter', AppState, number>(
  [
    { reducer: 'todos',  property: 'items.**' },
    { reducer: 'filter', property: 'q' }
  ],
  (s) => s.todos.items.filter(x => x.title.includes(s.filter.q)).length
);
```
