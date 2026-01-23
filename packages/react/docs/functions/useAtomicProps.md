[**@quojs/react**](../README.md)

***

[@quojs/react](../README.md) / useAtomicProps

# Function: useAtomicProps()

## Call Signature

> **useAtomicProps**\<`R`, `S`, `T`\>(`specs`, `selector`, `isEqual?`): `T`

Defined in: [hooks/hooks.ts:391](https://github.com/quojs/quojs/blob/74de3d2d0ff0336e38f1bb850c2a97571cea3f88/packages/react/src/hooks/hooks.ts#L391)

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

Defined in: [hooks/hooks.ts:396](https://github.com/quojs/quojs/blob/74de3d2d0ff0336e38f1bb850c2a97571cea3f88/packages/react/src/hooks/hooks.ts#L396)

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
