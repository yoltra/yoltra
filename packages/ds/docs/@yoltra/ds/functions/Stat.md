![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

[**@yoltra/ds**](../../../README.md)

***

[@yoltra/ds](../../../README.md) / [@yoltra/ds](../README.md) / Stat

# Function: Stat()

> **Stat**(`__namedParameters`): `Element`

Defined in: primitives/Stat/Stat.tsx:48

A single figure with its label.

## Parameters

### \_\_namedParameters

[`StatProps`](../interfaces/StatProps.md)

## Returns

`Element`

## Remarks

The highest usage-to-complexity ratio found in any consuming project: twenty-four uses across
four screens in one, five in a single file in another, and under forty lines in both.

The label comes before the value in the DOM as well as on screen, so a screen reader reads "open
downloads, twelve" rather than a number with no subject.

## Example

```tsx
<StatGrid>
  <Stat label="Open downloads" value={12} />
  <Stat label="Disk used" value="4.2 GB" hint="of 20 GB" />
  <Stat label="Failed" value={0} size="sm" />
</StatGrid>
```
