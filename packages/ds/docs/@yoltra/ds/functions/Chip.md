![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

[**@yoltra/ds**](../../../README.md)

***

[@yoltra/ds](../../../README.md) / [@yoltra/ds](../README.md) / Chip

# Function: Chip()

> **Chip**(`__namedParameters`): `Element`

Defined in: [primitives/Chip/Chip.tsx:31](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/primitives/Chip/Chip.tsx#L31)

A compact tag for a value: a format, a filter, a keyword.

## Parameters

### \_\_namedParameters

[`ChipProps`](../interfaces/ChipProps.md)

## Returns

`Element`

## Remarks

Distinct from [Badge](Badge.md), which is a pill and says something about *state*. A chip has a
small radius and reads as a piece of data, and the difference is worth keeping: a row of pills
all claiming to be statuses is noise. A consuming project drew the same line and used both.

Not interactive. A removable or selectable chip is a button, and this is a `span`.

## Example

```tsx
<Inline gap={1}>
  <Chip>gguf</Chip>
  <Chip variant="brand">q4_k_m</Chip>
</Inline>
```
