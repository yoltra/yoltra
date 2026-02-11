[**@quojs/react**](../README.md)

***

[@quojs/react](../README.md) / useSuspenseAtomicProp

# Function: useSuspenseAtomicProp()

## Call Signature

> **useSuspenseAtomicProp**\<`R`, `S`, `P`, `T`\>(`storeSpec`, `options`): `T`

Defined in: [react/src/hooks/suspense.ts:159](https://github.com/quojs/quojs/blob/7a847d68175722f00e52941458a1511185cf0a4e/packages/react/src/hooks/suspense.ts#L159)

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

Defined in: [react/src/hooks/suspense.ts:165](https://github.com/quojs/quojs/blob/7a847d68175722f00e52941458a1511185cf0a4e/packages/react/src/hooks/suspense.ts#L165)

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
