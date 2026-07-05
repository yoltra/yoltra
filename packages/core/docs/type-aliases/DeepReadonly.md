[**@yoltra/core**](../README.md)

***

[@yoltra/core](../README.md) / DeepReadonly

# Type Alias: DeepReadonly\<T\>

> **DeepReadonly**\<`T`\> = `T` *extends* infer A[] ? `ReadonlyArray`\<`DeepReadonly`\<`A`\>\> : `T` *extends* `object` ? `{ readonly [K in keyof T]: DeepReadonly<T[K]> }` : `T`

Defined in: [types.ts:1140](https://github.com/yoltra/yoltra/blob/ae94dea5790844eac37ee002f0fbed302029371e/packages/core/src/types.ts#L1140)

Deep readonly type: recursively makes all properties readonly.

## Type Parameters

### T

`T`

Type to make readonly.
