![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

[**@yoltra/ds**](../../../README.md)

***

[@yoltra/ds](../../../README.md) / [@yoltra/ds](../README.md) / IconButtonProps

# Interface: IconButtonProps

Defined in: [primitives/Button/Button.tsx:148](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/primitives/Button/Button.tsx#L148)

## Extends

- `ButtonHTMLAttributes`\<`HTMLButtonElement`\>.`ButtonStateProps`

## Properties

### children

> **children**: `ReactNode`

Defined in: [primitives/Button/Button.tsx:161](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/primitives/Button/Button.tsx#L161)

The glyph. Hidden from assistive technology, since `label` carries the meaning.

#### Overrides

`ButtonHTMLAttributes.children`

***

### label

> **label**: `string`

Defined in: [primitives/Button/Button.tsx:157](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/primitives/Button/Button.tsx#L157)

What the button does, in words.

#### Remarks

Required, and rendered visually hidden. An icon button with no accessible name is
announced as "button" and nothing else, which is among the most common failures in any
interface — so this component does not offer the option of omitting it.

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

Defined in: [primitives/Button/Button.tsx:159](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/primitives/Button/Button.tsx#L159)

***

### variant?

> `optional` **variant**: [`ButtonVariant`](../type-aliases/ButtonVariant.md)

Defined in: [primitives/Button/Button.tsx:158](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/primitives/Button/Button.tsx#L158)
