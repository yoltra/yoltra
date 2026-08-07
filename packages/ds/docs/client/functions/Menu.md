[**@yoltra/ds**](../../README.md)

***

[@yoltra/ds](../../README.md) / [client](../README.md) / Menu

# Function: Menu()

> **Menu**(`__namedParameters`): `Element`

Defined in: [overlay/Popover.tsx:350](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/overlay/Popover.tsx#L350)

A command menu anchored to a trigger, with arrow-key navigation.

## Parameters

### \_\_namedParameters

[`MenuProps`](../interfaces/MenuProps.md)

## Returns

`Element`

## Remarks

Focus moves to the first item on open and roves with ArrowUp/ArrowDown, Home and End, wrapping
at both ends. Enter and Space activate — natively, because items are real buttons. Escape and
an outside press close it, and so does Tab, which then continues past the trigger.

Typeahead (jumping to an item by typing its first letters) is not implemented; for menus of
the length a UI menu should be, the arrow keys are enough.

Ships from `@yoltra/ds/client`. Styles come from `@yoltra/ds/styles/popover.css`.

## Example

```tsx
<Menu
  open={open}
  onClose={() => setOpen(false)}
  label="Satellite actions"
  trigger={(props) => <IconButton {...props} onClick={() => setOpen((v) => !v)} label="Actions" />}
>
  <MenuItem onSelect={deploy}>Deploy panels</MenuItem>
  <MenuItem onSelect={boost} disabled>Boost orbit</MenuItem>
  <MenuSeparator />
  <MenuItem onSelect={decommission}>Decommission</MenuItem>
</Menu>
```
