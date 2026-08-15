![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

[**@yoltra/ds**](../../../README.md)

***

[@yoltra/ds](../../../README.md) / [@yoltra/ds](../README.md) / Slider

# Function: Slider()

> **Slider**(`__namedParameters`): `Element`

Defined in: [primitives/Form.tsx:328](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/primitives/Form.tsx#L328)

A control for choosing from a range.

## Parameters

### \_\_namedParameters

[`SliderProps`](../interfaces/SliderProps.md)

## Returns

`Element`

## Remarks

A native `<input type="range">`. Keyboard support, the value announcement and form
participation come with it; a custom track and thumb would have to earn all three back.

Needs a label like any other control — pair it with [FormField](FormField.md).

## Example

```tsx
<FormField id="depth" label="Replay buffer">
  {(control) => <Slider {...control} min={0} max={4} valueText={`${labels[depth]}`} />}
</FormField>
```
