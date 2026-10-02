![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

[**@yoltra/core**](../README.md)

***

[@yoltra/core](../README.md) / ReducerReplacement

# Type Alias: ReducerReplacement\<R, S, EM\>

> **ReducerReplacement**\<`R`, `S`, `EM`\> = `{ [K in R]?: ReducerSpec<S[K], EM> }`

Defined in: [types.ts:1659](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L1659)

What `replaceReducers` and `hotReplace({ reducer })` take: slice specs keyed by slice name,
each typed with **its own** slice's state, and every key optional.

## Type Parameters

### R

`R` *extends* `string`

Slice names.

### S

`S` *extends* `Record`\<`R`, `any`\>

State by slice name.

### EM

`EM` *extends* [`EventMapBase`](EventMapBase.md)

Event map.

## Remarks

Optional because the runtime treats an omitted slice in two ways, both legitimate: a slice the
replaced set owned is removed, and a slice mounted at runtime (`registerSlice`, `withSlice`, a
decorating library) is kept along with its state. Requiring every name made the only call that
typechecked on a decorated store one the runtime refuses, because naming a runtime slice
without `{ scope: "all" }` throws.

Per slice because a reducer for one slice must not be able to return another's state. Typing
each entry with the union of every slice's state allowed exactly that, and refused an
annotated reducer on any store with two slices.

Naming a slice mounted at runtime still typechecks and throws: telling the two kinds apart in
the type would need the store to track them separately, and the throw already says what to do.
