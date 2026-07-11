[**@yoltra/react**](../README.md)

***

[@yoltra/react](../README.md) / useSuspenseAtomicProp

# Function: useSuspenseAtomicProp()

## Call Signature

> **useSuspenseAtomicProp**\<`R`, `S`, `P`, `T`\>(`storeSpec`, `options`): `T`

Defined in: [react/src/hooks/suspense.ts:177](https://github.com/yoltra/yoltra/blob/deb942c60b290a53939a9e286974c0da4e3f44ce/packages/react/src/hooks/suspense.ts#L177)

Suspense-compatible version of `useAtomicProp` that throws a promise while loading.

Subscribes to a single dotted path and calls `options.load` to produce the
resolved value. While the promise is pending, React Suspense catches it and
renders the nearest `<Suspense>` fallback.

### Type Parameters

#### R

`R` *extends* `string`

Reducer name union.

#### S

`S` *extends* `Record`\<`R`, `any`\>

State record keyed by `R`.

#### P

`P` *extends* `string`

Dotted path within `S[R]`.

#### T

`T`

Resolved value type.

### Parameters

#### storeSpec

`{ reducer, property }` identifying the path to subscribe to.

##### property

`P`

##### reducer

`R`

#### options

[`SuspenseAtomicPropOptions`](../interfaces/SuspenseAtomicPropOptions.md)\<`T`, `S`\>

Loading options (see [SuspenseAtomicPropOptions](../interfaces/SuspenseAtomicPropOptions.md)).

### Returns

`T`

The resolved value of type `T`.

### Remarks

**Client-only loading.** During server rendering this hook does not suspend
(throwing a promise would crash `renderToString`): `getServerSnapshot` returns
the current value at the path **without** invoking `options.load`. Perform the
actual load on the client.

### Throws

A `Promise` while loading (caught by React Suspense).

### Throws

If called outside a `<StoreProvider>`.

### Example

```tsx
function UserName({ userId }: { userId: string }) {
  const name = useSuspenseAtomicProp(
    { reducer: 'users', property: `byId.${userId}.name` },
    { load: async (name) => name ?? (await fetchUser(userId)).name },
  );
  return <span>{name}</span>;
}

// Wrap with Suspense
<Suspense fallback={<Spinner />}>
  <UserName userId="123" />
</Suspense>
```

## Call Signature

> **useSuspenseAtomicProp**\<`R`, `S`, `T`\>(`storeSpec`, `options`): `T`

Defined in: [react/src/hooks/suspense.ts:183](https://github.com/yoltra/yoltra/blob/deb942c60b290a53939a9e286974c0da4e3f44ce/packages/react/src/hooks/suspense.ts#L183)

Suspense-compatible version of `useAtomicProp` that throws a promise while loading.

Subscribes to a single dotted path and calls `options.load` to produce the
resolved value. While the promise is pending, React Suspense catches it and
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

#### storeSpec

`{ reducer, property }` identifying the path to subscribe to.

##### property

`string`

##### reducer

`R`

#### options

[`SuspenseAtomicPropOptions`](../interfaces/SuspenseAtomicPropOptions.md)\<`T`, `S`\>

Loading options (see [SuspenseAtomicPropOptions](../interfaces/SuspenseAtomicPropOptions.md)).

### Returns

`T`

The resolved value of type `T`.

### Remarks

**Client-only loading.** During server rendering this hook does not suspend
(throwing a promise would crash `renderToString`): `getServerSnapshot` returns
the current value at the path **without** invoking `options.load`. Perform the
actual load on the client.

### Throws

A `Promise` while loading (caught by React Suspense).

### Throws

If called outside a `<StoreProvider>`.

### Example

```tsx
function UserName({ userId }: { userId: string }) {
  const name = useSuspenseAtomicProp(
    { reducer: 'users', property: `byId.${userId}.name` },
    { load: async (name) => name ?? (await fetchUser(userId)).name },
  );
  return <span>{name}</span>;
}

// Wrap with Suspense
<Suspense fallback={<Spinner />}>
  <UserName userId="123" />
</Suspense>
```
