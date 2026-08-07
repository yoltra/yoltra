![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

[**@yoltra/core**](../README.md)

***

[@yoltra/core](../README.md) / withHydration

# Function: withHydration()

> **withHydration**\<`R`\>(`reducers`, `hydration`): `R`

Defined in: [persistence/persist.ts:167](https://github.com/yoltra/yoltra/blob/main/packages/core/src/persistence/persist.ts#L167)

Replaces each reducer's initial state with what was restored for it.

## Type Parameters

### R

`R` *extends* `Record`\<`string`, `HasState`\>

## Parameters

### reducers

`R`

### hydration

[`Hydration`](../interfaces/Hydration.md)

## Returns

`R`

## Remarks

Slices absent from the payload keep their declared defaults, so adding a reducer does not
invalidate everything written before it existed.
