[**@quojs/react**](../README.md)

***

[@quojs/react](../README.md) / OneOrMany

# Type Alias: OneOrMany\<T\>

> **OneOrMany**\<`T`\> = `T` \| readonly `T`[]

Defined in: [react/src/hooks/hooks.ts:34](https://github.com/quojs/quojs/blob/90b047cd5df060b28c5f76a1ad4792631061e571/packages/react/src/hooks/hooks.ts#L34)

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
