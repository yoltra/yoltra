[**@quojs/react**](../README.md)

***

[@quojs/react](../README.md) / useSuspenseSliceProp

# Function: useSuspenseSliceProp()

> **useSuspenseSliceProp**\<`R`, `S`, `P`, `T`\>(`storeSpec`, `options`): `T`

Defined in: [hooks/suspense.ts:216](https://github.com/quojs/quojs/blob/2d6b527415c15d6d74080cf0fe76f6103c5ec172/packages/react/src/hooks/suspense.ts#L216)

Suspense version of a single-path selector (similar to `useSliceProp`).

Subscribes to an **exact** `reducer.property` path, invalidates the cache on changes,
and reads through a Suspense cache—**throwing a promise** while the `load` function resolves.

## Type Parameters

### R

`R` *extends* `string`

Slice name union.

### S

`S` *extends* `Record`\<`R`, `any`\>

State record keyed by `R`.

### P

`P` *extends* `string`

Dotted path type inside `S[R]` (exact path).

### T

`T`

Value type returned by `options.load`.

## Parameters

### storeSpec

`{ reducer, property }` pointing at a single path.

#### property

`P`

#### reducer

`R`

### options

[`SuspenseSlicePropOptions`](../interfaces/SuspenseSlicePropOptions.md)\<`T`, `S`\>

Loader/staleTime/key options.

## Returns

`T`

The loaded value `T`. Will **suspend** while loading and rethrow errors in the error boundary.

## Remarks

- If you pass a **glob** path (with `*`/`**`), the path is treated as “match anything” and the loader
  receives the **entire slice** as `valueAtPath`. (TypeScript will not enforce globs here.)
- For “cache until path changes”, use `staleTime: null`. Passing `0` expires immediately.

## Example

```tsx
import { Suspense } from 'react';

function UserPanel({ id }: { id: string }) {
  const user = useSuspenseSliceProp<'users', AppState, 'entities.${string}', User>(
    { reducer: 'users', property: `entities.${id}` as any },
    {
      load: (entity, slice) => entity ?? fetch(`/api/users/${id}`).then(r => r.json()),
      staleTime: 60_000 // 1 minute freshness
    }
  );
  return <div>{user.name}</div>;
}

export function Page() {
  return (
    <Suspense fallback="loading...">
      <UserPanel id="42" />
    </Suspense>
  );
}
```
