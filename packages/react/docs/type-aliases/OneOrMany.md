[**@yoltra/react**](../README.md)

***

[@yoltra/react](../README.md) / OneOrMany

# Type Alias: OneOrMany\<T\>

> **OneOrMany**\<`T`\> = `T` \| readonly `T`[]

Defined in: [react/src/hooks/hooks.ts:43](https://github.com/yoltra/yoltra/blob/7bf784f9e7daaf114608ff30306ac3400da926ed/packages/react/src/hooks/hooks.ts#L43)

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
