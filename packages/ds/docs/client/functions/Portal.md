[**@yoltra/ds**](../../README.md)

***

[@yoltra/ds](../../README.md) / [client](../README.md) / Portal

# Function: Portal()

> **Portal**(`__namedParameters`): `null` \| `ReactPortal`

Defined in: [overlay/Portal.tsx:42](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/overlay/Portal.tsx#L42)

Renders its children into a detached node under `document.body`.

## Parameters

### \_\_namedParameters

[`PortalProps`](../interfaces/PortalProps.md)

## Returns

`null` \| `ReactPortal`

## Remarks

Every overlay in this package goes through here, because the alternative — rendering in
place — loses to CSS in ways no amount of `z-index` fixes. An ancestor with `overflow:
hidden` clips the panel, an ancestor with `transform`, `filter` or `will-change` becomes the
containing block for `position: fixed`, and an ancestor that established a stacking context
traps the overlay beneath whatever sits above *that* ancestor. Portalling to the body sidesteps
all three: the overlay's only competition is the document's own stacking order, which is what
the `--yl-z-*` tokens describe.

Nothing renders until the effect runs, on the server and on the first client render alike, so
hydration sees the same empty output on both sides.

## Example

```tsx
<Portal>
  <div className="yl-toast">Saved</div>
</Portal>
```
