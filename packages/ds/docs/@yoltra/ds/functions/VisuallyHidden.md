![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

[**@yoltra/ds**](../../../README.md)

***

[@yoltra/ds](../../../README.md) / [@yoltra/ds](../README.md) / VisuallyHidden

# Function: VisuallyHidden()

> **VisuallyHidden**(`__namedParameters`): `Element`

Defined in: [primitives/VisuallyHidden.tsx:29](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/primitives/VisuallyHidden.tsx#L29)

Text for assistive technology, invisible on screen.

## Parameters

### \_\_namedParameters

[`VisuallyHiddenProps`](../interfaces/VisuallyHiddenProps.md)

## Returns

`Element`

## Remarks

Not `display: none` and not `hidden` — both remove the content from the accessibility tree
as well as from view, which is the opposite of what this is for. The style clips the element
to a single pixel while leaving it rendered, so a screen reader still reaches it.

The style itself has shipped in `base.css` as `.yl-visually-hidden` for some time; this is
the component that was missing.

## Example

```tsx
<button onClick={close}>
  <span aria-hidden="true">×</span>
  <VisuallyHidden>Close the inspector</VisuallyHidden>
</button>
```
