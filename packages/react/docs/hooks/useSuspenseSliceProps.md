[**@quojs/react**](../README.md)

***

[@quojs/react](../README.md) / useSuspenseSliceProps

# Function: useSuspenseSliceProps()

> **useSuspenseSliceProps**\<`R`, `S`, `T`\>(`specs`, `options`): `T`

Defined in: [hooks/suspense.ts:319](https://github.com/quojs/quojs/blob/2d6b527415c15d6d74080cf0fe76f6103c5ec172/packages/react/src/hooks/suspense.ts#L319)

Suspense version of a multi-path selector (similar to `useSliceProps`).

Subscribes to **multiple** `reducer.property` paths (supports globs),
invalidates the cache when **any** subscribed path changes, and returns a value
loaded through the Suspense cache.

## Type Parameters

### R

`R` *extends* `string`

Slice name union.

### S

`S` *extends* `Record`\<`R`, `any`\>

State record keyed by `R`.

### T

`T`

Value type returned by `options.load`.

## Parameters

### specs

`object`[]

Array of `{ reducer, property }`, where `property` can be a dotted string,
                 a glob (`*`/`**`), or an array of globs.

### options

[`SuspenseSlicePropsOptions`](../interfaces/SuspenseSlicePropsOptions.md)\<`T`, `S`\>

Loader/staleTime/key options.

## Returns

`T`

## Example

```tsx
import { Suspense } from 'react';

function VisibleTodos() {
  const items = useSuspenseSliceProps<
    'todos' | 'filter',
    AppState,
    { id: string; title: string }[]
  >(
    [
      { reducer: 'todos',  property: 'items.**' },
      { reducer: 'filter', property: 'q' }
    ],
    {
      load: (s) => s.todos.items.filter(x => x.title.includes(s.filter.q)),
      staleTime: null // cache until any of the subscribed paths change
    }
  );
  return <ul>{items.map(i => <li key={i.id}>{i.title}</li>)}</ul>;
}

export function Page() {
  return (
    <Suspense fallback="loading...">
      <VisibleTodos />
    </Suspense>
  );
}
```
