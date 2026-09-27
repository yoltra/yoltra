![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

[**@yoltra/ds**](../../../README.md)

***

[@yoltra/ds](../../../README.md) / [@yoltra/ds](../README.md) / SemanticColorTokens

# Interface: SemanticColorTokens

Defined in: [tokens/themes.ts:45](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/tokens/themes.ts#L45)

## Properties

### bg

> **bg**: `object`

Defined in: [tokens/themes.ts:56](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/tokens/themes.ts#L56)

Surfaces, from the page backwards. `ink` is the always-dark surface code sits on.

#### canvas

> **canvas**: `string`

#### elevated

> **elevated**: `string`

#### ink

> **ink**: `string`

#### inset

> **inset**: `string`

#### overlay

> **overlay**: `string`

#### panel

> **panel**: `string`

#### subtle

> **subtle**: `string`

***

### border

> **border**: `object`

Defined in: [tokens/themes.ts:59](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/tokens/themes.ts#L59)

#### divider

> **divider**: `string`

#### focus

> **focus**: `string`

#### onInk

> **onInk**: `string`

#### strong

> **strong**: `string`

#### subtle

> **subtle**: `string`

***

### brand

> **brand**: `object`

Defined in: [tokens/themes.ts:54](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/tokens/themes.ts#L54)

The brand colours, for identity rather than for text.

#### primary

> **primary**: `string`

#### secondary

> **secondary**: `string`

#### Remarks

`primary` is `#1A7FE2`, which is 4.06:1 on white: enough for a logo or display type under
WCAG's large-text threshold, and **not** enough for body copy. Text that wants to look
branded reads `fg.brand`, which is a step darker and passes.

***

### fg

> **fg**: `object`

Defined in: [tokens/themes.ts:58](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/tokens/themes.ts#L58)

Text and icons. `onInk` is for content on the `ink` surface, which does not flip with the theme.

#### brand

> **brand**: `string`

#### default

> **default**: `string`

#### disabled

> **disabled**: `string`

#### inverse

> **inverse**: `string`

#### link

> **link**: `string`

#### linkHover

> **linkHover**: `string`

#### muted

> **muted**: `string`

#### onInk

> **onInk**: `string`

#### secondary

> **secondary**: `string`

***

### interactive

> **interactive**: `object`

Defined in: [tokens/themes.ts:61](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/tokens/themes.ts#L61)

The loud interactive surface: a primary button, a selected tab.

#### bg

> **bg**: `string`

#### bgActive

> **bgActive**: `string`

#### bgHover

> **bgHover**: `string`

#### border

> **border**: `string`

#### fg

> **fg**: `string`

***

### interactiveQuiet

> **interactiveQuiet**: `object`

Defined in: [tokens/themes.ts:70](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/tokens/themes.ts#L70)

The quiet interactive surface: a ghost button, a menu item, a dialog's close control.

#### bg

> **bg**: `string`

#### bgActive

> **bgActive**: `string`

#### bgHover

> **bgHover**: `string`

#### border

> **border**: `string`

#### fg

> **fg**: `string`

#### Remarks

Shared rather than owned by `Button`, because three components already reach for it. It was
called `ghost`, which named a button variant and left `Modal` and `Popover` borrowing a
button's internals.

***

### status

> **status**: `object`

Defined in: [tokens/themes.ts:80](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/tokens/themes.ts#L80)

Feedback colours. `solid` is the accent on its own.

#### error

> **error**: `object`

##### error.bg

> **bg**: `string`

##### error.border

> **border**: `string`

##### error.fg

> **fg**: `string`

##### error.solid

> **solid**: `string`

#### info

> **info**: `object`

##### info.bg

> **bg**: `string`

##### info.border

> **border**: `string`

##### info.fg

> **fg**: `string`

##### info.solid

> **solid**: `string`

#### success

> **success**: `object`

##### success.bg

> **bg**: `string`

##### success.border

> **border**: `string`

##### success.fg

> **fg**: `string`

##### success.solid

> **solid**: `string`

#### warning

> **warning**: `object`

##### warning.bg

> **bg**: `string`

##### warning.border

> **border**: `string`

##### warning.fg

> **fg**: `string`

##### warning.solid

> **solid**: `string`

#### Remarks

The `bg`/`fg`/`border` triad covers a filled callout and nothing else. Consumers that
wanted a bare accent to tint or to draw a rule with reached for `--yl-color-success` and
`--yl-color-danger`, neither of which existed, so both fell through to a hardcoded hex that
did not flip with the theme.
