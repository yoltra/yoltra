[**@yoltra/ds**](../../../README.md)

***

[@yoltra/ds](../../../README.md) / [@yoltra/ds](../README.md) / Container

# Function: Container()

> **Container**(`__namedParameters`): `Element`

Defined in: [primitives/Layout.tsx:253](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/primitives/Layout.tsx#L253)

Centres page content and steps its width up at each breakpoint.

## Parameters

### \_\_namedParameters

[`ContainerProps`](../interfaces/ContainerProps.md)

## Returns

`Element`

## Remarks

The styles already existed as `.yl-container`; this is the component that was missing.

## Example

```tsx
<Container as="main">
  <Heading level={1}>Mission control</Heading>
</Container>
```
