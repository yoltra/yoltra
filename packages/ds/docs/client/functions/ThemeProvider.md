![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

[**@yoltra/ds**](../../README.md)

***

[@yoltra/ds](../../README.md) / [client](../README.md) / ThemeProvider

# Function: ThemeProvider()

> **ThemeProvider**(`__namedParameters`): `Element`

Defined in: [theme/ThemeProvider.tsx:64](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/theme/ThemeProvider.tsx#L64)

Holds the current theme and applies it to the document.

## Parameters

### \_\_namedParameters

#### children

`ReactNode`

#### defaultTheme?

`"light"` \| `"dark"` = `"light"`

## Returns

`Element`

## Example

```tsx
<ThemeProvider defaultTheme="dark">
  <App />
</ThemeProvider>
```
