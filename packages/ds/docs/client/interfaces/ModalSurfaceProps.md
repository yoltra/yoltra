![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

[**@yoltra/ds**](../../README.md)

***

[@yoltra/ds](../../README.md) / [client](../README.md) / ModalSurfaceProps

# Interface: ModalSurfaceProps

Defined in: [overlay/Modal.tsx:12](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/overlay/Modal.tsx#L12)

Props shared by the two modal surfaces.

## Extended by

- [`DialogProps`](DialogProps.md)
- [`DrawerProps`](DrawerProps.md)

## Properties

### children

> **children**: `ReactNode`

Defined in: [overlay/Modal.tsx:28](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/overlay/Modal.tsx#L28)

***

### className?

> `optional` **className**: `string`

Defined in: [overlay/Modal.tsx:49](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/overlay/Modal.tsx#L49)

***

### closeLabel?

> `optional` **closeLabel**: `string`

Defined in: [overlay/Modal.tsx:38](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/overlay/Modal.tsx#L38)

Accessible name for the close button. Default `"Close"`.

***

### container?

> `optional` **container**: `null` \| `HTMLElement`

Defined in: [overlay/Modal.tsx:48](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/overlay/Modal.tsx#L48)

Where to portal to. Defaults to `document.body`.

***

### description?

> `optional` **description**: `ReactNode`

Defined in: [overlay/Modal.tsx:27](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/overlay/Modal.tsx#L27)

Optional supporting line, wired up as `aria-describedby`.

***

### dismissOnEscape?

> `optional` **dismissOnEscape**: `boolean`

Defined in: [overlay/Modal.tsx:34](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/overlay/Modal.tsx#L34)

Whether Escape closes it. Default `true`.

***

### dismissOnOutsideClick?

> `optional` **dismissOnOutsideClick**: `boolean`

Defined in: [overlay/Modal.tsx:32](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/overlay/Modal.tsx#L32)

Whether a press on the scrim closes it. Default `true`.

***

### footer?

> `optional` **footer**: `ReactNode`

Defined in: [overlay/Modal.tsx:30](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/overlay/Modal.tsx#L30)

Pinned to the bottom of the surface — actions, usually.

***

### initialFocusRef?

> `optional` **initialFocusRef**: `RefObject`\<`null` \| `HTMLElement`\>

Defined in: [overlay/Modal.tsx:46](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/overlay/Modal.tsx#L46)

What to focus on open. Defaults to the first focusable element in the surface.

#### Remarks

Worth setting for a destructive confirmation, where the first focusable element is usually
the button you least want a stray Enter to press.

***

### onClose()

> **onClose**: () => `void`

Defined in: [overlay/Modal.tsx:16](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/overlay/Modal.tsx#L16)

Called when the user asks to close — Escape, the scrim, or the close button.

#### Returns

`void`

***

### open

> **open**: `boolean`

Defined in: [overlay/Modal.tsx:14](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/overlay/Modal.tsx#L14)

Whether the surface is on screen. These are controlled components; there is no internal open state.

***

### showCloseButton?

> `optional` **showCloseButton**: `boolean`

Defined in: [overlay/Modal.tsx:36](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/overlay/Modal.tsx#L36)

Whether to render the close button in the header. Default `true`.

***

### title

> **title**: `ReactNode`

Defined in: [overlay/Modal.tsx:25](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/overlay/Modal.tsx#L25)

The accessible name, rendered in the header.

#### Remarks

Required rather than optional. A modal with no name is announced as "dialog" and nothing
else, which is the single most common accessibility failure in this component. Wrap it in
`VisuallyHidden` if the design calls for no visible heading.
