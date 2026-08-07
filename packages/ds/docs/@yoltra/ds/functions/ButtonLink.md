[**@yoltra/ds**](../../../README.md)

***

[@yoltra/ds](../../../README.md) / [@yoltra/ds](../README.md) / ButtonLink

# Function: ButtonLink()

> **ButtonLink**(`__namedParameters`): `Element`

Defined in: [primitives/Button.tsx:65](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/primitives/Button.tsx#L65)

An anchor that looks like a button.

## Parameters

### \_\_namedParameters

[`ButtonLinkProps`](../interfaces/ButtonLinkProps.md)

## Returns

`Element`

## Remarks

For navigation that should read as an action. It stays an `<a>`, so it keeps the things
links have and buttons do not — opening in a new tab, copying the address, being followed by
a crawler. Use [Button](Button.md) when the thing does not go anywhere.

## Example

```tsx
<ButtonLink href="/docs/quick-start">Read the guide</ButtonLink>
```
