[**@quojs/core**](../README.md)

***

[@quojs/core](../README.md) / Path

# Type Alias: Path\<T\>

> **Path**\<`T`\> = `T` *extends* [`Primitive`](Primitive.md) ? `never` : `T` *extends* readonly infer U[] ? `` `${number}` `` \| `Path`\<`U`\> *extends* `never` ? `never` : `` `${number}.${Path<U>}` `` : \{ \[K in keyof T & string\]: T\[K\] extends Primitive ? K : K \| (Path\<T\[K\]\> extends never ? never : \`$\{K\}.$\{Path\<(...)\[(...)\]\>\}\`) \}\[keyof `T` & `string`\]

Defined in: [types.ts:559](https://github.com/quojs/quojs/blob/d7e7368223439ffec372ae1e5232d6f03b0a0e1f/packages/core/src/types.ts#L559)

Compute dotted paths of T, including nested objects and arrays.

## Type Parameters

### T

`T`

Type to compute paths for.
