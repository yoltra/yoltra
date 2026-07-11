[**@yoltra/react**](../README.md)

***

[@yoltra/react](../README.md) / useSuspenseAtomicProps

# Function: useSuspenseAtomicProps()

## Call Signature

> **useSuspenseAtomicProps**\<`R`, `S`, `T`\>(`specs`, `options`): `T`

Defined in: [react/src/hooks/suspense.ts:307](https://github.com/yoltra/yoltra/blob/deb942c60b290a53939a9e286974c0da4e3f44ce/packages/react/src/hooks/suspense.ts#L307)

Suspense-compatible version of `useAtomicProps` that throws a promise while loading.

Subscribes to multiple dotted paths and calls `options.load` with the full state
to produce the resolved value. While the promise is pending, React Suspense
renders the nearest `<Suspense>` fallback.

### Type Parameters

#### R

`R` *extends* `string`

Reducer name union.

#### S

`S` *extends* `Record`\<`R`, `any`\>

State record keyed by `R`.

#### T

`T`

Resolved value type.

### Parameters

#### specs

`object`[]

Array of `{ reducer, property }` paths to subscribe to.

#### options

[`SuspenseAtomicPropsOptions`](../interfaces/SuspenseAtomicPropsOptions.md)\<`T`, `S`\>

Loading options (see [SuspenseAtomicPropsOptions](../interfaces/SuspenseAtomicPropsOptions.md)).

### Returns

`T`

The resolved value of type `T`.

### Remarks

**Client-only loading.** During server rendering this hook does not suspend
(throwing a promise would crash `renderToString`): `getServerSnapshot` uses a
synchronous `options.load` result if one is available, otherwise `undefined`.
Perform the actual load on the client.

### Throws

A `Promise` while loading (caught by React Suspense).

### Throws

If called outside a `<StoreProvider>`.

### Example

```tsx
function Dashboard() {
  const stats = useSuspenseAtomicProps(
    [
      { reducer: 'orders', property: 'items.**' },
      { reducer: 'users', property: 'active' },
    ],
    { load: async (state) => computeDashboardStats(state) },
  );
  return <StatsGrid data={stats} />;
}
```

## Call Signature

> **useSuspenseAtomicProps**\<`R`, `S`, `T`\>(`specs`, `options`): `T`

Defined in: [react/src/hooks/suspense.ts:314](https://github.com/yoltra/yoltra/blob/deb942c60b290a53939a9e286974c0da4e3f44ce/packages/react/src/hooks/suspense.ts#L314)

Suspense-compatible version of `useAtomicProps` that throws a promise while loading.

Subscribes to multiple dotted paths and calls `options.load` with the full state
to produce the resolved value. While the promise is pending, React Suspense
renders the nearest `<Suspense>` fallback.

### Type Parameters

#### R

`R` *extends* `string`

Reducer name union.

#### S

`S` *extends* `Record`\<`R`, `any`\>

State record keyed by `R`.

#### T

`T`

Resolved value type.

### Parameters

#### specs

`object`[]

Array of `{ reducer, property }` paths to subscribe to.

#### options

[`SuspenseAtomicPropsOptions`](../interfaces/SuspenseAtomicPropsOptions.md)\<`T`, `S`\>

Loading options (see [SuspenseAtomicPropsOptions](../interfaces/SuspenseAtomicPropsOptions.md)).

### Returns

`T`

The resolved value of type `T`.

### Remarks

**Client-only loading.** During server rendering this hook does not suspend
(throwing a promise would crash `renderToString`): `getServerSnapshot` uses a
synchronous `options.load` result if one is available, otherwise `undefined`.
Perform the actual load on the client.

### Throws

A `Promise` while loading (caught by React Suspense).

### Throws

If called outside a `<StoreProvider>`.

### Example

```tsx
function Dashboard() {
  const stats = useSuspenseAtomicProps(
    [
      { reducer: 'orders', property: 'items.**' },
      { reducer: 'users', property: 'active' },
    ],
    { load: async (state) => computeDashboardStats(state) },
  );
  return <StatsGrid data={stats} />;
}
```
