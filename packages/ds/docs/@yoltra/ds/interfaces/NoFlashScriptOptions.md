![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

[**@yoltra/ds**](../../../README.md)

***

[@yoltra/ds](../../../README.md) / [@yoltra/ds](../README.md) / NoFlashScriptOptions

# Interface: NoFlashScriptOptions

Defined in: [theme/noFlashScript.ts:14](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/theme/noFlashScript.ts#L14)

## Properties

### storageKey?

> `optional` **storageKey**: `string`

Defined in: [theme/noFlashScript.ts:24](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/theme/noFlashScript.ts#L24)

The `localStorage` key. Defaults to [THEME\_STORAGE\_KEY](../variables/THEME_STORAGE_KEY.md).

#### Remarks

[ThemeProvider](../../../client/functions/ThemeProvider.md) always reads and writes [THEME\_STORAGE\_KEY](../variables/THEME_STORAGE_KEY.md)
and takes no key of its own, so alongside the provider leave this unset: a script that reads
a different key restores nothing, silently. Set it only when the application persists the
theme itself, with [applyTheme](../../../client/functions/applyTheme.md) and a key of its own.
