[**@yoltra/ds**](../../README.md)

***

[@yoltra/ds](../../README.md) / [client](../README.md) / applyTheme

# Function: applyTheme()

> **applyTheme**(`theme`): `void`

Defined in: [theme/ThemeProvider.tsx:46](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/theme/ThemeProvider.tsx#L46)

Sets `data-theme` on the document root.

## Parameters

### theme

`"light"` | `"dark"`

## Returns

`void`

## Remarks

The whole theming mechanism is this attribute: every colour is a CSS custom property
redefined under `[data-theme='dark']`, so switching is one attribute write and no React
re-render. Call it directly to theme a page that does not mount [ThemeProvider](ThemeProvider.md).

## Example

```ts
// Before hydration, from an inline script, to avoid a flash of the wrong theme.
applyTheme(localStorage.getItem("theme") === "dark" ? "dark" : "light");
```
