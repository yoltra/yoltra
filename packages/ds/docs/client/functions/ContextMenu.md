[**@yoltra/ds**](../../README.md)

***

[@yoltra/ds](../../README.md) / [client](../README.md) / ContextMenu

# Function: ContextMenu()

> **ContextMenu**(`__namedParameters`): `Element`

Defined in: [overlay/Popover.tsx:417](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/overlay/Popover.tsx#L417)

A command menu opened at a pointer position.

## Parameters

### \_\_namedParameters

[`ContextMenuProps`](../interfaces/ContextMenuProps.md)

## Returns

`Element`

## Remarks

The same navigation and dismissal as [Menu](Menu.md), anchored to a point instead of an element —
the placement maths treats a point as a zero-sized rectangle, so it flips near the bottom of
the window and clamps near the right edge exactly as an element-anchored menu does.

Ships from `@yoltra/ds/client`. Styles come from `@yoltra/ds/styles/popover.css`.

## Example

```tsx
const [at, setAt] = useState<{ x: number; y: number } | null>(null);

<tr onContextMenu={(e) => { e.preventDefault(); setAt({ x: e.clientX, y: e.clientY }); }}>…</tr>

<ContextMenu at={at} onClose={() => setAt(null)} label="Row actions">
  <MenuItem onSelect={rename}>Rename</MenuItem>
</ContextMenu>
```
