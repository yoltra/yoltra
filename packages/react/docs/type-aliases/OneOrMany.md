[**@yoltra/react**](../README.md)

***

[@yoltra/react](../README.md) / OneOrMany

# Type Alias: OneOrMany\<T\>

> **OneOrMany**\<`T`\> = `T` \| readonly `T`[]

Defined in: [react/src/hooks/hooks.ts:44](https://github.com/yoltra/yoltra/blob/deb942c60b290a53939a9e286974c0da4e3f44ce/packages/react/src/hooks/hooks.ts#L44)

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
