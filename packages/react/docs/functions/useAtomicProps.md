[**@quojs/react**](../README.md)

***

[@quojs/react](../README.md) / useAtomicProps

# Function: useAtomicProps()

> **useAtomicProps**\<`R`, `S`, `T`\>(`specs`, `selector`, `isEqual`): `T`

Defined in: [hooks/hooks.ts:346](https://github.com/quojs/quojs/blob/4b080313e808fe306ce36b57ad9b04440da9effc/packages/react/src/hooks/hooks.ts#L346)

**Multi-path** fine-grained selector.

Subscribes to several `reducer.property` paths (supports deep & wildcard)
and recomputes `selector(state)` when any of them change.

## Type Parameters

### R

`R` *extends* `string`

Slice name union.

### S

`S` *extends* `Record`\<`R`, `any`\>

State record keyed by `R`.

### T

`T`

Derived value type.

## Parameters

### specs

`object`[]

Array of `{ reducer, property }`, where `property` can be a string or array of strings. Supports `*`/`**`.

### selector

(`state`) => `T`

`(state) => T` function run against the full state.

### isEqual

(`a`, `b`) => `boolean`

Equality comparator for the derived value (defaults to `Object.is`).

## Returns

`T`

## Example

```tsx
const total = useAtomicProps<'todos' | 'filter', AppState, number>(
  [
    { reducer: 'todos',  property: ['items.**'] },
    { reducer: 'filter', property: 'q' }
  ],
  (s) => s.todos.items.filter(x => x.title.includes(s.filter.q)).length
);
```
