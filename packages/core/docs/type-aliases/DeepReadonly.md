[**@yoltra/core**](../README.md)

***

[@yoltra/core](../README.md) / DeepReadonly

# Type Alias: DeepReadonly\<T\>

> **DeepReadonly**\<`T`\> = `T` *extends* infer A[] ? `ReadonlyArray`\<`DeepReadonly`\<`A`\>\> : `T` *extends* `object` ? `{ readonly [K in keyof T]: DeepReadonly<T[K]> }` : `T`

Defined in: [types.ts:1011](https://github.com/yoltra/yoltra/blob/7bf784f9e7daaf114608ff30306ac3400da926ed/packages/core/src/types.ts#L1011)

Deep readonly type: recursively makes all properties readonly.

## Type Parameters

### T

`T`

Type to make readonly.
