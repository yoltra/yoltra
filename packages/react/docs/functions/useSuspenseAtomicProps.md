[**@quojs/react**](../README.md)

***

[@quojs/react](../README.md) / useSuspenseAtomicProps

# Function: useSuspenseAtomicProps()

> **useSuspenseAtomicProps**\<`R`, `S`, `T`\>(`specs`, `options`): `T`

Defined in: [hooks/suspense.ts:260](https://github.com/quojs/quojs/blob/4b080313e808fe306ce36b57ad9b04440da9effc/packages/react/src/hooks/suspense.ts#L260)

Suspense version of a multi-path selector (atomic subscriptions).

Subscribes to **multiple** `reducer.property` paths (supports globs),
invalidates the cache when **any** subscribed path changes, and returns a value
loaded through the Suspense cache.

## Type Parameters

### R

`R` *extends* `string`

Reducer name union.

### S

`S` *extends* `Record`\<`R`, `any`\>

State record keyed by `R`.

### T

`T`

Value type returned by `options.load`.

## Parameters

### specs

`object`[]

### options

[`SuspenseSlicePropsOptions`](../interfaces/SuspenseSlicePropsOptions.md)\<`T`, `S`\>

## Returns

`T`
