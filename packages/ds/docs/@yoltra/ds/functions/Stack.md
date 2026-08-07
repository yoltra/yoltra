[**@yoltra/ds**](../../../README.md)

***

[@yoltra/ds](../../../README.md) / [@yoltra/ds](../README.md) / Stack

# Function: Stack()

> **Stack**(`__namedParameters`): `Element`

Defined in: [primitives/Layout.tsx:95](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/primitives/Layout.tsx#L95)

Stacks its children vertically.

## Parameters

### \_\_namedParameters

[`FlowProps`](../interfaces/FlowProps.md)

## Returns

`Element`

## Remarks

The most-reached-for layout in any interface, and the reason a design system has one: a
column of things separated by a value from the scale, rather than a margin invented at each
call site and drifting from its neighbours.

## Example

```tsx
<Stack gap={3}>
  <Heading level={2}>Peers</Heading>
  <Text tone="secondary">Every node this gateway can reach.</Text>
</Stack>
```
