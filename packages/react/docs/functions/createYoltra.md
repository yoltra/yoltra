[**@yoltra/react**](../README.md)

***

[@yoltra/react](../README.md) / createYoltra

# Function: createYoltra()

> **createYoltra**\<`RM`\>(`cfg`): [`Yoltra`](../interfaces/Yoltra.md)\<keyof `RM` & `string`, `StateFromReducers`\<`RM`\>, `EMFromReducersStrict`\<`RM`\>\>

Defined in: [react/src/createYoltra.tsx:85](https://github.com/yoltra/yoltra/blob/deb942c60b290a53939a9e286974c0da4e3f44ce/packages/react/src/createYoltra.tsx#L85)

One-call setup: create a store and its fully-typed React hooks together.

## Type Parameters

### RM

`RM` *extends* `ReducersMapAny`

Reducers map; state shape and event map are inferred from it.

## Parameters

### cfg

The same configuration accepted by createStore.

#### dedupWindowMs?

`number`

#### devtools?

\{ `allowReplay?`: `boolean`; \}

#### devtools.allowReplay?

`boolean`

#### effects?

`EffectSpec`\<`DeepReadonly`\<`StateFromReducers`\<`RM`\>\>, `EMFromReducersStrict`\<`RM`\>\>[]

#### middleware?

`MiddlewareFunction`\<`DeepReadonly`\<`StateFromReducers`\<`RM`\>\>, `EMFromReducersStrict`\<`RM`\>\>[]

#### name

`string`

#### onEffectError?

(`error`, `event`) => `void`

#### reducer

`RM`

## Returns

[`Yoltra`](../interfaces/Yoltra.md)\<keyof `RM` & `string`, `StateFromReducers`\<`RM`\>, `EMFromReducersStrict`\<`RM`\>\>

The `store`, an optional `StoreProvider`, the raw `StoreContext`, and
the full set of typed hooks (`useAtomicProp`, `useAtomicProps`, `useEmit`,
`useEvent`, `useSelector`, `useStore`, `shallowEqual`).

## Remarks

Collapses the `createStore` + context + `createHooks` boilerplate into a
single call. The returned hooks default to the created store, so wrapping your
tree in a `<StoreProvider>` is **optional** — use it only to scope a different
store instance to a subtree (e.g. a fresh store per test).

**Client-only convenience.** The store created here is a module-level
singleton, and the Suspense hooks share a module-global cache. Do not reuse a
`createYoltra(...)` module across SSR requests — state and cache would bleed
between them. For SSR, create a store per request and scope it with
`StoreProvider`.

## Example

```tsx
export const { store, useAtomicProp, useEmit } = createYoltra({
  name: 'App',
  reducer: {
    counter: {
      state: { value: 0 },
      events: [['ui', 'increment']],
      reducer: (s, e) => (e.type === 'increment' ? { value: s.value + e.payload } : s),
    },
  },
});

function Counter() {
  const value = useAtomicProp({ reducer: 'counter', property: 'value' });
  const emit = useEmit();
  return <button onClick={() => emit('ui', 'increment', 1)}>{value}</button>;
}
```
