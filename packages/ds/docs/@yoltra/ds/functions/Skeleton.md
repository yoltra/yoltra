![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

[**@yoltra/ds**](../../../README.md)

***

[@yoltra/ds](../../../README.md) / [@yoltra/ds](../README.md) / Skeleton

# Function: Skeleton()

> **Skeleton**(`__namedParameters`): `Element`

Defined in: [primitives/Feedback.tsx:65](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/primitives/Feedback.tsx#L65)

A placeholder for content that has not arrived.

## Parameters

### \_\_namedParameters

[`SkeletonProps`](../interfaces/SkeletonProps.md)

## Returns

`Element`

## Remarks

Hidden from assistive technology. A screen reader announcing a row of grey boxes tells its
user nothing they can act on; the live region that announces the *arrival* is what carries
meaning, and that belongs to whatever is loading rather than to its placeholder.

## Example

```tsx
{peers === undefined ? <Skeleton width="18rem" /> : <PeerList peers={peers} />}
```
