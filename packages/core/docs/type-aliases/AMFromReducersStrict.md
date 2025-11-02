[**@quojs/core**](../README.md)

***

[@quojs/core](../README.md) / AMFromReducersStrict

# Type Alias: AMFromReducersStrict\<RM\>

> **AMFromReducersStrict**\<`RM`\> = `RM`\[keyof `RM`\] *extends* [`ReducerSpec`](../interfaces/ReducerSpec.md)\<`any`, infer AM\> ? `RM`\[keyof `RM`\] *extends* [`ReducerSpec`](../interfaces/ReducerSpec.md)\<`any`, `AM`\> ? `AM` : `never` : `never`

Defined in: [types.ts:181](https://github.com/quojs/quojs/blob/67acf22c99f7bb5bc1300e174ce891cc1abf66aa/packages/core/src/types.ts#L181)

## Type Parameters

### RM

`RM` *extends* [`ReducersMapAny`](ReducersMapAny.md)
