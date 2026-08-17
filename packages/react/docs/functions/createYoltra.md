![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

[**@yoltra/react**](../README.md)

***

[@yoltra/react](../README.md) / createYoltra

# Function: createYoltra()

> **createYoltra**\<`RM`\>(`cfg`): [`Yoltra`](../interfaces/Yoltra.md)\<keyof `RM` & `string`, `StateFromReducers`\<`RM`\>, `EMFromReducersStrict`\<`RM`\>\>

Defined in: [react/src/createYoltra.tsx:102](https://github.com/yoltra/yoltra/blob/main/packages/react/src/createYoltra.tsx#L102)

One-call setup: create a store and its fully-typed React hooks together.

## Type Parameters

### RM

`RM` *extends* `ReducersMapAny`

Reducers map; state shape and event map are inferred from it.

## Parameters

### cfg

The same configuration accepted by [createStore](https://github.com/yoltra/yoltra/blob/main/packages/core/docs/functions/createStore.md).

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
`useEvent`, `useSelector`, `useStore`, `useSuspenseAtomicProp`,
`useSuspenseAtomicProps`, `shallowEqual`).

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

**The Suspense hooks are part of this set.** Take `useSuspenseAtomicProp` and
`useSuspenseAtomicProps` from here, not from the `@yoltra/react` barrel: the
barrel's copies read the *package-level* context, which this function never
fills, so they would throw `useStore must be used inside <StoreProvider>` at
runtime with nothing in the types to warn you — the two are identical in
shape. The ones returned here are bound to this store's own context and need
no provider, like the rest of the set.

## Examples

```tsx
export const { store, useAtomicProp, useSuspenseAtomicProp } = createYoltra({ ... });

// No <StoreProvider> anywhere: every hook above already knows this store.
createRoot(el).render(<App />);
```

```tsx
export const { store, useAtomicProp, useEmit } = createYoltra({
  name: 'App',
  reducer: {
    counter: {
      state: { value: 0 },
      when: { keys: [['ui', 'increment']] },
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
