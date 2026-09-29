![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

[**@yoltra/ds**](../../../README.md)

***

[@yoltra/ds](../../../README.md) / [@yoltra/ds](../README.md) / ButtonProps

# Interface: ButtonProps

Defined in: [primitives/Button/Button.tsx:68](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/primitives/Button/Button.tsx#L68)

## Extends

- `ButtonHTMLAttributes`\<`HTMLButtonElement`\>.`ButtonStateProps`

## Properties

### children

> **children**: `ReactNode`

Defined in: [primitives/Button/Button.tsx:71](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/primitives/Button/Button.tsx#L71)

#### Overrides

`ButtonHTMLAttributes.children`

***

### loading?

> `optional` **loading**: `boolean`

Defined in: [primitives/Button/Button.tsx:46](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/primitives/Button/Button.tsx#L46)

Work is in flight.

#### Remarks

Sets `aria-busy` and `aria-disabled` rather than `disabled`, so the control keeps its place in
the tab order and a reader is not thrown out of it mid-action. Clicks are swallowed while it
is set.

The label stays in the layout at zero opacity rather than being hidden, which keeps the
button exactly as wide as it was and keeps its accessible name: `visibility: hidden` and
`display: none` both remove the text from the accessibility tree, leaving a busy button with
no name.

#### Inherited from

`ButtonStateProps.loading`

***

### pressed?

> `optional` **pressed**: `boolean`

Defined in: [primitives/Button/Button.tsx:54](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/primitives/Button/Button.tsx#L54)

Whether a toggle button is on.

#### Remarks

Becomes `aria-pressed`. Set it only when the button really is a toggle: on a button that
performs an action, `aria-pressed` reports a state that does not exist.

#### Inherited from

`ButtonStateProps.pressed`

***

### size?

> `optional` **size**: [`ButtonSize`](../type-aliases/ButtonSize.md)

Defined in: [primitives/Button/Button.tsx:70](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/primitives/Button/Button.tsx#L70)

***

### variant?

> `optional` **variant**: [`ButtonVariant`](../type-aliases/ButtonVariant.md)

Defined in: [primitives/Button/Button.tsx:69](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/primitives/Button/Button.tsx#L69)
