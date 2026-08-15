![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

[**@yoltra/core**](../README.md)

***

[@yoltra/core](../README.md) / Dotted

# Type Alias: Dotted\<Slice\>

> **Dotted**\<`Slice`\> = `Slice` *extends* [`RootValue`](RootValue.md) ? `""` : keyof `Slice` & `string` \| [`Path`](Path.md)\<`Slice`\>

Defined in: [types.ts:1256](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L1256)

Dotted keys of a slice: top-level keys or any nested path.

## Type Parameters

### Slice

`Slice`

Slice state type.

## Remarks

A slice that **is** one value — a primitive, a `Map`, a `Set`, a `Date` — has no key to
address, and its only subscribable path is the empty one. Saying so is what makes
`{ reducer, property: "" }` type-check where it can actually fire, instead of falling through
to the untyped `property: string` overload and returning `unknown`.

The conditional distributes over unions, which is why a nullable object slice gets both:
`Dotted<{ a: number } | null>` is `"" | "a"`. That is exactly right — such a slice really does
change at its root when it becomes `null`, and at `"a"` otherwise.
