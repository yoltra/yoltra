![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

[**@yoltra/ds**](../../../README.md)

***

[@yoltra/ds](../../../README.md) / [@yoltra/ds](../README.md) / Grid

# Function: Grid()

> **Grid**(`__namedParameters`): `Element`

Defined in: [primitives/Layout.tsx:200](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/primitives/Layout.tsx#L200)

A grid that reflows without media queries.

## Parameters

### \_\_namedParameters

[`GridProps`](../interfaces/GridProps.md)

## Returns

`Element`

## Remarks

Give it `minItemWidth` and it fits as many columns as will hold that width, which is
responsive without any breakpoint being named. Give it `columns` for a fixed count when the
layout genuinely is fixed.

## Example

```tsx
<Grid minItemWidth="24rem" gap={4}>
  {peers.map((p) => <PeerCard key={p.id} peer={p} />)}
</Grid>
```
