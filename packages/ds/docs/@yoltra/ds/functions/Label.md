![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

[**@yoltra/ds**](../../../README.md)

***

[@yoltra/ds](../../../README.md) / [@yoltra/ds](../README.md) / Label

# Function: Label()

> **Label**(`__namedParameters`): `Element`

Defined in: [primitives/Form/Form.tsx:29](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/primitives/Form/Form.tsx#L29)

A field's label.

## Parameters

### \_\_namedParameters

[`LabelProps`](../interfaces/LabelProps.md)

## Returns

`Element`

## Remarks

Prefer [FormField](FormField.md), which renders this and wires the `id` and `aria-describedby` for you.
This exists for the layouts `FormField`'s column does not fit, such as a label beside its
control in a toolbar.

It exists at all because the class did not work on its own. `.yl-label` was styled only as
`.yl-field > .yl-label`, while this package's own documentation showed a bare
`<label className="yl-label">`; a consuming project copied that example sixteen times and every
one of them received no styling. The rule is standalone now, and this component means nobody has
to know the class name to get it.

## Example

```tsx
<Label htmlFor="host">Hub host</Label>
<Input id="host" name="host" />
```
