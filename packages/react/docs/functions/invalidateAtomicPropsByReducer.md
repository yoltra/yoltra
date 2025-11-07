[**@quojs/react**](../README.md)

***

[@quojs/react](../README.md) / invalidateAtomicPropsByReducer

# Function: invalidateAtomicPropsByReducer()

> **invalidateAtomicPropsByReducer**(`reducer`): `void`

Defined in: [hooks/suspense.ts:362](https://github.com/quojs/quojs/blob/4b080313e808fe306ce36b57ad9b04440da9effc/packages/react/src/hooks/suspense.ts#L362)

Invalidates **all** cache entries under a given reducer.

## Parameters

### reducer

`string`

## Returns

`void`

## Example

```ts
invalidateAtomicPropsByReducer('todos');
```
