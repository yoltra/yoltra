![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

[**@yoltra/core**](../README.md)

***

[@yoltra/core](../README.md) / withHydration

# Function: withHydration()

> **withHydration**\<`R`\>(`reducers`, `hydration`): `R`

Defined in: [persistence/persist.ts:162](https://github.com/yoltra/yoltra/blob/main/packages/core/src/persistence/persist.ts#L162)

Replaces each reducer's initial state with what was restored for it.

## Type Parameters

### R

`R` *extends* `Record`\<`string`, \{ `state`: `unknown`; \}\>

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
