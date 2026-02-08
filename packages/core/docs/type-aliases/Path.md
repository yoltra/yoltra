[**@quojs/core**](../README.md)

***

[@quojs/core](../README.md) / Path

# Type Alias: Path\<T\>

> **Path**\<`T`\> = `T` *extends* [`Primitive`](Primitive.md) ? `never` : `T` *extends* readonly infer U[] ? `` `${number}` `` \| `Path`\<`U`\> *extends* `never` ? `never` : `` `${number}.${Path<U>}` `` : \{ \[K in keyof T & string\]: T\[K\] extends Primitive ? K : K \| (Path\<T\[K\]\> extends never ? never : \`$\{K\}.$\{Path\<(...)\[(...)\]\>\}\`) \}\[keyof `T` & `string`\]

Defined in: [types.ts:881](https://github.com/quojs/quojs/blob/90b047cd5df060b28c5f76a1ad4792631061e571/packages/core/src/types.ts#L881)

Compute dotted paths of T, including nested objects and arrays.

## Type Parameters

### T

`T`

Type to compute paths for.
