![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

[**@yoltra/ds**](../../../README.md)

***

[@yoltra/ds](../../../README.md) / [@yoltra/ds](../README.md) / Inline

# Function: Inline()

> **Inline**(`__namedParameters`): `Element`

Defined in: [primitives/Layout.tsx:145](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/primitives/Layout.tsx#L145)

Lays its children out in a row, wrapping when they run out of room.

## Parameters

### \_\_namedParameters

[`InlineProps`](../interfaces/InlineProps.md)

## Returns

`Element`

## Remarks

Wraps by default. A row of tags or buttons that refuses to wrap is a row that overflows its
container on a narrow screen, and a design system defaulting to that is a design system
whose users write `flex-wrap` everywhere.

## Example

```tsx
<Inline gap={2} align="center">
  <Badge>open</Badge>
  <Text size="sm" tone="muted">last seen 3s ago</Text>
</Inline>
```
