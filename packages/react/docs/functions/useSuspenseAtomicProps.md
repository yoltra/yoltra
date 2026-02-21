[**@yoltra/react**](../README.md)

***

[@yoltra/react](../README.md) / useSuspenseAtomicProps

# Function: useSuspenseAtomicProps()

## Call Signature

> **useSuspenseAtomicProps**\<`R`, `S`, `T`\>(`specs`, `options`): `T`

Defined in: [react/src/hooks/suspense.ts:260](https://github.com/yoltra/yoltra/blob/a987f4d35946c58f44d8b45d3fefadd911124683/packages/react/src/hooks/suspense.ts#L260)

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

Defined in: [react/src/hooks/suspense.ts:267](https://github.com/yoltra/yoltra/blob/a987f4d35946c58f44d8b45d3fefadd911124683/packages/react/src/hooks/suspense.ts#L267)

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
