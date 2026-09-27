![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

[**@yoltra/ds**](../../../README.md)

***

[@yoltra/ds](../../../README.md) / [@yoltra/ds](../README.md) / ProgressBarProps

# Interface: ProgressBarProps

Defined in: primitives/ProgressBar/ProgressBar.tsx:3

## Extends

- `Omit`\<`HTMLAttributes`\<`HTMLDivElement`\>, `"role"`\>

## Properties

### label

> **label**: `string`

Defined in: primitives/ProgressBar/ProgressBar.tsx:15

What is progressing, in words.

#### Remarks

Required. A bar with no name is announced as a percentage with no subject, and a reader who
cannot see which section it sits in has no way to find out what it measures.

***

### max?

> `optional` **max**: `number`

Defined in: primitives/ProgressBar/ProgressBar.tsx:7

The end of the range. Defaults to `100`.

***

### value

> **value**: `number`

Defined in: primitives/ProgressBar/ProgressBar.tsx:5

How far along, between `0` and `max`.

***

### valueText?

> `optional` **valueText**: `string`

Defined in: primitives/ProgressBar/ProgressBar.tsx:22

A human reading of the value, for assistive technology.

#### Remarks

Becomes `aria-valuetext`. "3 of 12 files" is more use than "25", and a percentage rarely is.
