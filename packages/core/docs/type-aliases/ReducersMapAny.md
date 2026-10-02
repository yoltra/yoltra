![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

[**@yoltra/core**](../README.md)

***

[@yoltra/core](../README.md) / ReducersMapAny

# Type Alias: ReducersMapAny

> **ReducersMapAny** = `Record`\<`string`, [`ReducerSpec`](../interfaces/ReducerSpec.md)\<`any`, `any`\>\>

Defined in: [types.ts:1485](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L1485)

Any map of slice names to reducer specs.

## Remarks

The constraint for a helper that takes a store's `reducer` option and infers from it, as
[StateFromReducers](StateFromReducers.md) and [EMFromReducersStrict](EMFromReducersStrict.md) do.
