![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

[**@yoltra/ds**](../../../README.md)

***

[@yoltra/ds](../../../README.md) / [@yoltra/ds](../README.md) / noFlashScript

# Function: noFlashScript()

> **noFlashScript**(`__namedParameters`): `string`

Defined in: [theme/noFlashScript.ts:55](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/theme/noFlashScript.ts#L55)

The script that sets the theme before the first paint.

## Parameters

### \_\_namedParameters

[`NoFlashScriptOptions`](../interfaces/NoFlashScriptOptions.md) = `{}`

## Returns

`string`

## Remarks

`ThemeProvider` reads `localStorage` in an effect, which runs after the browser has already
painted. Between those two moments the document shows whatever the server rendered, so a reader
who chose dark gets a white flash on every navigation.

The only fix is to set the attribute synchronously, before the body renders, which means an
inline script. This package documented that and shipped no artifact for it; a consuming project
wrote its own and another simply flashed.

Inline it in the document head, before any stylesheet:

## Example

```tsx
// app/layout.tsx
<head>
  <script dangerouslySetInnerHTML={{ __html: noFlashScript() }} />
</head>
```

It falls back to `prefers-color-scheme` when nothing is stored, and is wrapped in `try` because
reading `localStorage` throws outright in a browser configured to block site data. A theme that
fails to restore is a preference lost; an exception here is a blank page.
