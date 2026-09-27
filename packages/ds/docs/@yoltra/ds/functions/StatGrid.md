![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

[**@yoltra/ds**](../../../README.md)

***

[@yoltra/ds](../../../README.md) / [@yoltra/ds](../README.md) / StatGrid

# Function: StatGrid()

> **StatGrid**(`__namedParameters`): `Element`

Defined in: [primitives/Stat/Stat.tsx:74](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/primitives/Stat/Stat.tsx#L74)

A responsive row of stats.

## Parameters

### \_\_namedParameters

[`StatGridProps`](../interfaces/StatGridProps.md)

## Returns

`Element`

## Remarks

Fills by available width rather than by a column count, so the same markup works in a sidebar and
across a dashboard. Use [Grid](Grid.md) when the number of columns is the thing that matters.
