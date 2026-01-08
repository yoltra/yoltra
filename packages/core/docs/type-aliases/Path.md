[**@quojs/core**](../README.md)

***

[@quojs/core](../README.md) / Path

# Type Alias: Path\<T\>

> **Path**\<`T`\> = `T` *extends* [`Primitive`](Primitive.md) ? `never` : `T` *extends* readonly infer U[] ? `` `${number}` `` \| `Path`\<`U`\> *extends* `never` ? `never` : `` `${number}.${Path<U>}` `` : \{ \[K in keyof T & string\]: T\[K\] extends Primitive ? K : K \| (Path\<T\[K\]\> extends never ? never : \`$\{K\}.$\{Path\<(...)\[(...)\]\>\}\`) \}\[keyof `T` & `string`\]

Defined in: [types.ts:499](https://github.com/quojs/quojs/blob/8b1c0adc6b9ff8a764bce1cedbec68a1d02e95ee/packages/core/src/types.ts#L499)

Compute dotted paths of T, including nested objects and arrays.

## Type Parameters

### T

`T`

Type to compute paths for.
