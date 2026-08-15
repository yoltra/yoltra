![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

[**@yoltra/ds**](../../../README.md)

***

[@yoltra/ds](../../../README.md) / [@yoltra/ds](../README.md) / Badge

# Function: Badge()

> **Badge**(`__namedParameters`): `Element`

Defined in: [primitives/Badge.tsx:24](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/primitives/Badge.tsx#L24)

A small label for status or category.

## Parameters

### \_\_namedParameters

[`BadgeProps`](../interfaces/BadgeProps.md)

## Returns

`Element`

## Remarks

Decorative by default. A badge carrying meaning no other text carries — a connection state,
a count — should be announced, so give it a `role` and a label rather than trusting colour
and position to convey it.

## Example

```tsx
<Badge variant="brand">0.2.0</Badge>
<Badge role="status" aria-label="Link open">open</Badge>
```
