[**@yoltra/core**](../README.md)

***

[@yoltra/core](../README.md) / DeepReadonly

# Type Alias: DeepReadonly\<T\>

> **DeepReadonly**\<`T`\> = `T` *extends* infer A[] ? `ReadonlyArray`\<`DeepReadonly`\<`A`\>\> : `T` *extends* `object` ? `{ readonly [K in keyof T]: DeepReadonly<T[K]> }` : `T`

Defined in: [types.ts:1140](https://github.com/yoltra/yoltra/blob/deb942c60b290a53939a9e286974c0da4e3f44ce/packages/core/src/types.ts#L1140)

Deep readonly type: recursively makes all properties readonly.

## Type Parameters

### T

`T`

Type to make readonly.
