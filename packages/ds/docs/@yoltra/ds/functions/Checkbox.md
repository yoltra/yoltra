[**@yoltra/ds**](../../../README.md)

***

[@yoltra/ds](../../../README.md) / [@yoltra/ds](../README.md) / Checkbox

# Function: Checkbox()

> **Checkbox**(`__namedParameters`): `Element`

Defined in: [primitives/Form.tsx:162](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/primitives/Form.tsx#L162)

A checkbox.

## Parameters

### \_\_namedParameters

[`ToggleProps`](../interfaces/ToggleProps.md)

## Returns

`Element`

## Remarks

A native `<input type="checkbox">` inside its own `<label>`, styled with `accent-color`
rather than replaced. A div dressed as a checkbox has to re-implement keyboard handling,
the indeterminate state, form participation and every assistive-technology behaviour the
native control already has — and usually re-implements some of them.

## Example

```tsx
<Checkbox name="autoReconnect" label="Reconnect automatically" defaultChecked />
```
