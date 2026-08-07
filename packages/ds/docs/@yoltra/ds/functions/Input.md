[**@yoltra/ds**](../../../README.md)

***

[@yoltra/ds](../../../README.md) / [@yoltra/ds](../README.md) / Input

# Function: Input()

> **Input**(`__namedParameters`): `Element`

Defined in: [primitives/Field.tsx:42](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/primitives/Field.tsx#L42)

A text input.

## Parameters

### \_\_namedParameters

[`InputProps`](../interfaces/InputProps.md)

## Returns

`Element`

## Remarks

Every field needs a label a screen reader can reach. Pair it with a `<label htmlFor>`, or
with [VisuallyHidden](VisuallyHidden.md) where the design leaves no room for visible text — a
`placeholder` is not a label: it disappears the moment somebody types.

## Example

```tsx
<label className="yl-label" htmlFor="host">Hub host</label>
<Input id="host" name="host" block placeholder="127.0.0.1" />
```
