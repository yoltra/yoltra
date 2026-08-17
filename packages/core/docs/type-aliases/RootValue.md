![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

[**@yoltra/core**](../README.md)

***

[@yoltra/core](../README.md) / RootValue

# Type Alias: RootValue

> **RootValue** = [`Primitive`](Primitive.md) \| `ReadonlyMap`\<`unknown`, `unknown`\> \| `ReadonlySet`\<`unknown`\>

Defined in: [types.ts:1437](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L1437)

A value with **no addressable interior**: its changes are reported at the slice root rather
than at a path beneath it.

## Remarks

The distinction the path types were missing. `Map` and `Set` keep their contents outside own
enumerable keys, so walking them with `keyof` yields the names of their *methods* — which is
how `"byId.get"` and `"byId.size"` came to be offered as subscribable paths, and why a slice
holding a plain number autocompleted `"toFixed"`. Neither ever notified anything, because
`detectChangedProps` reports such a value at its own path and never descends into it.

This is the type-level counterpart of that runtime rule: what the diff reports at the root,
the types address at the root, with the empty path.
