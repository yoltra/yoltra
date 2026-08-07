[**@yoltra/ds**](../../../README.md)

***

[@yoltra/ds](../../../README.md) / [@yoltra/ds](../README.md) / SpinnerProps

# Interface: SpinnerProps

Defined in: [primitives/Feedback.tsx:3](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/primitives/Feedback.tsx#L3)

## Extends

- `HTMLAttributes`\<`HTMLSpanElement`\>

## Properties

### label?

> `optional` **label**: `string`

Defined in: [primitives/Feedback.tsx:15](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/primitives/Feedback.tsx#L15)

What is being waited for.

#### Remarks

Rendered visually hidden inside a `role="status"` region, so the wait is announced rather
than being a silent spinning shape. It defaults to "Loading" — a spinner nobody can
perceive is worse than no spinner, and leaving the label optional-and-absent is how that
happens.

***

### size?

> `optional` **size**: `"sm"` \| `"md"` \| `"lg"`

Defined in: [primitives/Feedback.tsx:5](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/primitives/Feedback.tsx#L5)

Diameter. Defaults to `md`.
