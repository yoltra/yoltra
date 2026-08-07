![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

[**@yoltra/core**](../README.md)

***

[@yoltra/core](../README.md) / createMemoryAdapter

# Function: createMemoryAdapter()

> **createMemoryAdapter**(`initial?`): [`PersistenceAdapter`](../interfaces/PersistenceAdapter.md)

Defined in: [persistence/adapters.ts:52](https://github.com/yoltra/yoltra/blob/main/packages/core/src/persistence/adapters.ts#L52)

Keeps state in memory.

## Parameters

### initial?

`Record`\<`string`, `string`\>

## Returns

[`PersistenceAdapter`](../interfaces/PersistenceAdapter.md)

## Remarks

For tests, and for a server render that wants the persistence path exercised without a
store behind it. It forgets on restart, which is the whole of what it claims.
