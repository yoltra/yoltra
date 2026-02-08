[**@quojs/core**](../README.md)

***

[@quojs/core](../README.md) / PathValue

# Type Alias: PathValue\<T, P\>

> **PathValue**\<`T`, `P`\> = `P` *extends* `` `${infer K}.${infer Rest}` `` ? `K` *extends* keyof `T` ? `PathValue`\<`T`\[`K`\], `Rest`\> : `K` *extends* `` `${number}` `` ? `T` *extends* readonly infer E[] ? `PathValue`\<`E`, `Rest`\> : `never` : `never` : `P` *extends* keyof `T` ? `T`\[`P`\] : `P` *extends* `` `${number}` `` ? `T` *extends* readonly infer E[] ? `E` : `never` : `never`

Defined in: [types.ts:791](https://github.com/quojs/quojs/blob/90b047cd5df060b28c5f76a1ad4792631061e571/packages/core/src/types.ts#L791)

Resolves the value type at a dotted path `P` inside object/array `T`.
Supports numeric segments for array indexing (e.g., `"items.0.title"`).

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
type T3 = PathValue<S, 'todos'>;            // Array<{ title: string; done: boolean }>
```
