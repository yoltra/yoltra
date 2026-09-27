![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

[**@yoltra/core**](../README.md)

***

[@yoltra/core](../README.md) / Prettify

# Type Alias: Prettify\<T\>

> **Prettify**\<`T`\> = `{ [K in keyof T]: T[K] }` & `object`

Defined in: [types.ts:1926](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L1926)

Flattens an intersection into a single object type.

## Type Parameters

### T

`T`

## Remarks

Chaining decorations produces `S & Record<"a", A> & Record<"b", B>`, which is correct but
displays as an intersection in every hover and error message. This collapses it.

Apply it at the **top level only**. It is a homomorphic mapped type, so running it over a
slice whose state *is* a `Map`, `Set` or `Date` destroys that type - the same failure
[DeepReadonly](DeepReadonly.md) handles the built-ins explicitly to avoid.
