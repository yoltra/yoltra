[**@yoltra/ds**](../../README.md)

***

[@yoltra/ds](../../README.md) / [client](../README.md) / Drawer

# Function: Drawer()

> **Drawer**(`__namedParameters`): `Element`

Defined in: [overlay/Modal.tsx:216](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/overlay/Modal.tsx#L216)

A modal panel anchored to one edge of the viewport.

## Parameters

### \_\_namedParameters

[`DrawerProps`](../interfaces/DrawerProps.md)

## Returns

`Element`

## Remarks

The same machinery as [Dialog](Dialog.md) — trapped focus, locked scroll, Escape and scrim
dismissal — with the surface pinned to an edge instead of centred. Use it when the content is
a list or a form long enough that a centred box would need its own scrollbar anyway.

Ships from `@yoltra/ds/client`. Styles come from `@yoltra/ds/styles/modal.css`.

## Example

```tsx
<Drawer open={open} onClose={close} side="right" size="42rem" title="Filters">
  <FilterForm />
</Drawer>
```
