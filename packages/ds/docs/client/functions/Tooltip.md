![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

[**@yoltra/ds**](../../README.md)

***

[@yoltra/ds](../../README.md) / [client](../README.md) / Tooltip

# Function: Tooltip()

> **Tooltip**(`__namedParameters`): `Element`

Defined in: [overlay/Tooltip.tsx:68](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/overlay/Tooltip.tsx#L68)

A short description that appears on hover or focus.

## Parameters

### \_\_namedParameters

[`TooltipProps`](../interfaces/TooltipProps.md)

## Returns

`Element`

## Remarks

Uncontrolled, unlike the rest of the overlay tier: a tooltip's visibility belongs to the
pointer and the focus ring, not to application state.

It never takes focus. Moving focus into a tooltip would strand a keyboard user inside a thing
that exists only while they are somewhere else — which is also why it is wired with
`aria-describedby` rather than being focusable content. Escape hides it, per the tooltip
pattern, for a reader who wants it out of the way without moving the pointer.

The pointer delay exists so that a cursor crossing a row of icon buttons does not flash a
tooltip on every one of them. Focus skips the delay, because arriving by keyboard is
deliberate in a way that passing over with a mouse is not.

Ships from `@yoltra/ds/client`. Styles come from `@yoltra/ds/styles/tooltip.css`.

## Example

```tsx
<Tooltip content="Deploy the solar array">
  {(props) => <IconButton {...props} label="Deploy" icon={<SunIcon />} />}
</Tooltip>
```
