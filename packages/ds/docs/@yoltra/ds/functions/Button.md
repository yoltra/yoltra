![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

[**@yoltra/ds**](../../../README.md)

***

[@yoltra/ds](../../../README.md) / [@yoltra/ds](../README.md) / Button

# Function: Button()

> **Button**(`__namedParameters`): `Element`

Defined in: [primitives/Button/Button.tsx:94](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/primitives/Button/Button.tsx#L94)

A button.

## Parameters

### \_\_namedParameters

[`ButtonProps`](../interfaces/ButtonProps.md)

## Returns

`Element`

## Remarks

`primary` for the one action a view is about; `ghost` for everything beside it. A screen
with two primary buttons has told the reader nothing about which one to press. `danger` for
something that destroys, and only for that: a warning colour used for emphasis stops reading
as a warning.

## Example

```tsx
<Button onClick={connect}>Connect</Button>
<Button variant="ghost" size="sm" onClick={cancel}>Cancel</Button>
<Button variant="danger" onClick={remove}>Delete</Button>
<Button size="lg" loading={saving} onClick={save}>Save</Button>
<Button pressed={bold} onClick={toggleBold}>Bold</Button>
```
