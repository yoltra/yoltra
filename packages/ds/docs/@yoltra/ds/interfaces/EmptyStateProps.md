![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

[**@yoltra/ds**](../../../README.md)

***

[@yoltra/ds](../../../README.md) / [@yoltra/ds](../README.md) / EmptyStateProps

# Interface: EmptyStateProps

Defined in: [primitives/Feedback.tsx:80](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/primitives/Feedback.tsx#L80)

## Extends

- `Omit`\<`HTMLAttributes`\<`HTMLDivElement`\>, `"title"`\>

## Properties

### action?

> `optional` **action**: `ReactNode`

Defined in: [primitives/Feedback.tsx:95](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/primitives/Feedback.tsx#L95)

A way out: usually a button that creates the missing thing.

***

### description?

> `optional` **description**: `ReactNode`

Defined in: [primitives/Feedback.tsx:93](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/primitives/Feedback.tsx#L93)

***

### headingLevel?

> `optional` **headingLevel**: `4` \| `6` \| `2` \| `3` \| `5`

Defined in: [primitives/Feedback.tsx:104](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/primitives/Feedback.tsx#L104)

Outline level for the title.

#### Remarks

Configurable because an empty state can sit anywhere in a page, and a fixed `h2` inside a
card nested under an `h3` leaves a hole in the outline that a screen-reader user navigates
by.

***

### icon?

> `optional` **icon**: `ReactNode`

Defined in: [primitives/Feedback.tsx:82](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/primitives/Feedback.tsx#L82)

A glyph or small illustration. Decorative — it is hidden from assistive technology.

***

### title

> **title**: `ReactNode`

Defined in: [primitives/Feedback.tsx:92](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/primitives/Feedback.tsx#L92)

The headline.

#### Remarks

Shadows the HTML `title` attribute, which is deliberately omitted from this interface: a
tooltip and a heading are different things, and accepting a `ReactNode` here is worth more
than passing through an attribute that browsers render inconsistently and touch users
cannot reach at all.
