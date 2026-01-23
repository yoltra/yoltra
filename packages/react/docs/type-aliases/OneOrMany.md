[**@quojs/react**](../README.md)

***

[@quojs/react](../README.md) / OneOrMany

# Type Alias: OneOrMany\<T\>

> **OneOrMany**\<`T`\> = `T` \| readonly `T`[]

Defined in: [hooks/hooks.ts:56](https://github.com/quojs/quojs/blob/d7e7368223439ffec372ae1e5232d6f03b0a0e1f/packages/react/src/hooks/hooks.ts#L56)

Accepts either a single value or a readonly array of that value.
Useful for APIs that take one-or-many keys.

## Type Parameters

### T

`T`

## Example

```ts
function takeIds(ids: OneOrMany<string>) { /* ... */ }
takeIds('a');
takeIds(['a','b'] as const);
```
