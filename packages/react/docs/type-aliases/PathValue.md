[**@quojs/react**](../README.md)

***

[@quojs/react](../README.md) / PathValue

# Type Alias: PathValue\<T, P\>

> **PathValue**\<`T`, `P`\> = `P` *extends* `` `${infer K}.${infer Rest}` `` ? `K` *extends* keyof `T` ? `PathValue`\<`T`\[`K`\], `Rest`\> : `never` : `P` *extends* keyof `T` ? `T`\[`P`\] : `never`

Defined in: [hooks/hooks.ts:34](https://github.com/quojs/quojs/blob/3a7e48ef6dc2bf6db713ff04100a2a0e1ee72ff5/packages/react/src/hooks/hooks.ts#L34)

Resolves the value type at a **dotted path** `P` inside object/array `T`.
Supports numeric segments for arrays (e.g., `"items.0.title"`).

## Type Parameters

### T

`T`

Root type to index into.

### P

`P` *extends* `string`

Dotted path string.

## Example

```ts
type S = { todos: Array<{ title: string; done: boolean }> };
type T1 = PathValue<S['todos'], '0.title'>; // string
type T2 = PathValue<S, 'todos.0'>;          // { title: string; done: boolean }
```
