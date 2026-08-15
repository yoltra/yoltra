![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

[**@yoltra/ds**](../../README.md)

***

[@yoltra/ds](../../README.md) / [client](../README.md) / useTheme

# Function: useTheme()

> **useTheme**(): [`ThemeContextValue`](../interfaces/ThemeContextValue.md)

Defined in: [theme/ThemeProvider.tsx:101](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/theme/ThemeProvider.tsx#L101)

Reads and sets the current theme.

## Returns

[`ThemeContextValue`](../interfaces/ThemeContextValue.md)

## Throws

When called outside [ThemeProvider](ThemeProvider.md) — a hook that silently returned a default
would leave a toggle that renders correctly and changes nothing.

## Example

```tsx
const { theme, setTheme } = useTheme();
<Button onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>Toggle theme</Button>
```
