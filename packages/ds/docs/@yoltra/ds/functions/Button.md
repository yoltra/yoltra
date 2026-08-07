[**@yoltra/ds**](../../../README.md)

***

[@yoltra/ds](../../../README.md) / [@yoltra/ds](../README.md) / Button

# Function: Button()

> **Button**(`__namedParameters`): `Element`

Defined in: [primitives/Button.tsx:35](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/primitives/Button.tsx#L35)

A button.

## Parameters

### \_\_namedParameters

[`ButtonProps`](../interfaces/ButtonProps.md)

## Returns

`Element`

## Remarks

`primary` for the one action a view is about; `ghost` for everything beside it. A screen
with two primary buttons has told the reader nothing about which one to press.

## Example

```tsx
<Button onClick={connect}>Connect</Button>
<Button variant="ghost" size="sm" onClick={cancel}>Cancel</Button>
```
