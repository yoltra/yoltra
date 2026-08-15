![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

[**@yoltra/ds**](../../README.md)

***

[@yoltra/ds](../../README.md) / [client](../README.md) / Dialog

# Function: Dialog()

> **Dialog**(`__namedParameters`): `Element`

Defined in: [overlay/Modal.tsx:193](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/overlay/Modal.tsx#L193)

A modal dialog, centred over a scrim.

## Parameters

### \_\_namedParameters

[`DialogProps`](../interfaces/DialogProps.md)

## Returns

`Element`

## Remarks

Controlled: `open` and `onClose` are the whole state contract, so the surface never disagrees
with the application about whether it is showing.

While it is open, focus is trapped inside it and returned to whatever had focus before on
close, the page behind it does not scroll, and Escape and a press on the scrim both close it.
Nested overlays are handled by a shared stack — Escape inside a menu opened from a dialog
closes the menu, not both.

Ships from `@yoltra/ds/client`: it renders through a portal, manages focus, and listens on
the document. Styles come from `@yoltra/ds/styles/modal.css`.

## Example

```tsx
const [open, setOpen] = useState(false);

<Dialog
  open={open}
  onClose={() => setOpen(false)}
  title="Decommission satellite"
  description="This cannot be undone."
  footer={
    <>
      <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
      <Button onClick={confirm}>Decommission</Button>
    </>
  }
>
  <Text>SAT-04 will stop reporting telemetry immediately.</Text>
</Dialog>
```
