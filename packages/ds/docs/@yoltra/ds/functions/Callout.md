![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

[**@yoltra/ds**](../../../README.md)

***

[@yoltra/ds](../../../README.md) / [@yoltra/ds](../README.md) / Callout

# Function: Callout()

> **Callout**(`__namedParameters`): `Element`

Defined in: [primitives/Callout.tsx:35](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/primitives/Callout.tsx#L35)

An aside that draws attention: a note, a warning, a consequence worth stating.

## Parameters

### \_\_namedParameters

[`CalloutProps`](../interfaces/CalloutProps.md)

## Returns

`Element`

## Remarks

Rendered as `role="note"` with a decorative icon. The `kind` changes colour and glyph, so
the text has to carry the meaning on its own — a reader who cannot see the red will only
have the words.

## Example

```tsx
<Callout kind="warning">
  A gateway with no authenticator admits nobody. Set one before deploying.
</Callout>
```
