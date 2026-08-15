![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

[**@yoltra/core**](../README.md)

***

[@yoltra/core](../README.md) / Path

# Type Alias: Path\<T\>

> **Path**\<`T`\> = `T` *extends* [`RootValue`](RootValue.md) ? `never` : `T` *extends* readonly infer U[] ? `` `${number}` `` \| `Path`\<`U`\> *extends* `never` ? `never` : `` `${number}.${Path<U>}` `` : \{ \[K in keyof T & string\]: T\[K\] extends Primitive ? K : K \| (Path\<T\[K\]\> extends never ? never : \`$\{K\}.$\{Path\<(...)\[(...)\]\>\}\`) \}\[keyof `T` & `string`\]

Defined in: [types.ts:1220](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L1220)

Compute dotted paths of T, including nested objects and arrays.

## Type Parameters

### T

`T`

Type to compute paths for.
