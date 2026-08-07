[**@yoltra/ds**](../../../README.md)

***

[@yoltra/ds](../../../README.md) / [@yoltra/ds](../README.md) / EmptyState

# Function: EmptyState()

> **EmptyState**(`__namedParameters`): `Element`

Defined in: [primitives/Feedback.tsx:122](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/primitives/Feedback.tsx#L122)

What to show where there is nothing to show.

## Parameters

### \_\_namedParameters

[`EmptyStateProps`](../interfaces/EmptyStateProps.md)

## Returns

`Element`

## Example

```tsx
<EmptyState
  icon="🛰"
  title="No peers connected"
  description="Start a node, or check the gateway is reachable."
  action={<Button onClick={retry}>Retry</Button>}
/>
```
