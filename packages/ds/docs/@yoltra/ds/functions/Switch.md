![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

[**@yoltra/ds**](../../../README.md)

***

[@yoltra/ds](../../../README.md) / [@yoltra/ds](../README.md) / Switch

# Function: Switch()

> **Switch**(`__namedParameters`): `Element`

Defined in: [primitives/Form.tsx:275](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/primitives/Form.tsx#L275)

An on/off control that takes effect immediately.

## Parameters

### \_\_namedParameters

[`ToggleProps`](../interfaces/ToggleProps.md)

## Returns

`Element`

## Remarks

A native checkbox carrying `role="switch"`, which is what makes a reader hear "on"/"off"
rather than "checked"/"unchecked". Use it for a setting that applies the moment it is
flipped; a checkbox is the right control for something that takes effect when a form is
submitted.

## Example

```tsx
<Switch name="verbose" label="Verbose diagnostics" onChange={(e) => setVerbose(e.target.checked)} />
```
