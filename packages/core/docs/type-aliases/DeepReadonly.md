[**@quojs/core**](../README.md)

***

[@quojs/core](../README.md) / DeepReadonly

# Type Alias: DeepReadonly\<T\>

> **DeepReadonly**\<`T`\> = `T` *extends* infer A[] ? `ReadonlyArray`\<`DeepReadonly`\<`A`\>\> : `T` *extends* `object` ? `{ readonly [K in keyof T]: DeepReadonly<T[K]> }` : `T`

Defined in: [types.ts:534](https://github.com/quojs/quojs/blob/8b1c0adc6b9ff8a764bce1cedbec68a1d02e95ee/packages/core/src/types.ts#L534)

Deep readonly type: recursively makes all properties readonly.

## Type Parameters

### T

`T`

Type to make readonly.
