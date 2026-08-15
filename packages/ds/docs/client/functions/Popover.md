![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

[**@yoltra/ds**](../../README.md)

***

[@yoltra/ds](../../README.md) / [client](../README.md) / Popover

# Function: Popover()

> **Popover**(`__namedParameters`): `Element`

Defined in: [overlay/Popover.tsx:191](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/overlay/Popover.tsx#L191)

A non-modal panel anchored to a trigger.

## Parameters

### \_\_namedParameters

[`PopoverProps`](../interfaces/PopoverProps.md)

## Returns

`Element`

## Remarks

Unlike [Dialog](Dialog.md), this does not trap focus or lock scrolling — a popover sits beside the
page rather than over it. It closes on Escape, on a press outside it, and when focus leaves for
something that is neither it nor its trigger.

The `trigger` render prop receives the ARIA wiring (`aria-expanded`, `aria-haspopup`,
`aria-controls`) and the ref used to position against. Spread it; the open state stays yours.

Ships from `@yoltra/ds/client`. Styles come from `@yoltra/ds/styles/popover.css`.

## Example

```tsx
const [open, setOpen] = useState(false);

<Popover
  open={open}
  onClose={() => setOpen(false)}
  label="Telemetry settings"
  trigger={(props) => (
    <Button {...props} onClick={() => setOpen((v) => !v)}>Settings</Button>
  )}
>
  <Stack gap={3}>…</Stack>
</Popover>
```
