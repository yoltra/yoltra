![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

[**@yoltra/ds**](../../../README.md)

***

[@yoltra/ds](../../../README.md) / [@yoltra/ds](../README.md) / THEME\_STORAGE\_KEY

# Variable: THEME\_STORAGE\_KEY

> `const` **THEME\_STORAGE\_KEY**: `"yoltra-theme"` = `"yoltra-theme"`

Defined in: [theme/noFlashScript.ts:12](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/theme/noFlashScript.ts#L12)

Where the chosen theme is remembered.

## Remarks

Shared by [ThemeProvider](../../../client/functions/ThemeProvider.md) and [noFlashScript](../functions/noFlashScript.md) from one place, because the two must
agree: a script that reads one key while the provider writes another restores nothing, and does
so silently. A consuming project hit the other side of this, writing its own key and finding a
theme set by a neighbouring application on the same origin was not remembered.
