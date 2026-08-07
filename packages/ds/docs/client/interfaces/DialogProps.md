[**@yoltra/ds**](../../README.md)

***

[@yoltra/ds](../../README.md) / [client](../README.md) / DialogProps

# Interface: DialogProps

Defined in: [overlay/Modal.tsx:52](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/overlay/Modal.tsx#L52)

Props shared by the two modal surfaces.

## Extends

- [`ModalSurfaceProps`](ModalSurfaceProps.md)

## Properties

### children

> **children**: `ReactNode`

Defined in: [overlay/Modal.tsx:28](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/overlay/Modal.tsx#L28)

#### Inherited from

[`ModalSurfaceProps`](ModalSurfaceProps.md).[`children`](ModalSurfaceProps.md#children)

***

### className?

> `optional` **className**: `string`

Defined in: [overlay/Modal.tsx:49](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/overlay/Modal.tsx#L49)

#### Inherited from

[`ModalSurfaceProps`](ModalSurfaceProps.md).[`className`](ModalSurfaceProps.md#classname)

***

### closeLabel?

> `optional` **closeLabel**: `string`

Defined in: [overlay/Modal.tsx:38](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/overlay/Modal.tsx#L38)

Accessible name for the close button. Default `"Close"`.

#### Inherited from

[`ModalSurfaceProps`](ModalSurfaceProps.md).[`closeLabel`](ModalSurfaceProps.md#closelabel)

***

### container?

> `optional` **container**: `null` \| `HTMLElement`

Defined in: [overlay/Modal.tsx:48](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/overlay/Modal.tsx#L48)

Where to portal to. Defaults to `document.body`.

#### Inherited from

[`ModalSurfaceProps`](ModalSurfaceProps.md).[`container`](ModalSurfaceProps.md#container)

***

### description?

> `optional` **description**: `ReactNode`

Defined in: [overlay/Modal.tsx:27](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/overlay/Modal.tsx#L27)

Optional supporting line, wired up as `aria-describedby`.

#### Inherited from

[`ModalSurfaceProps`](ModalSurfaceProps.md).[`description`](ModalSurfaceProps.md#description)

***

### dismissOnEscape?

> `optional` **dismissOnEscape**: `boolean`

Defined in: [overlay/Modal.tsx:34](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/overlay/Modal.tsx#L34)

Whether Escape closes it. Default `true`.

#### Inherited from

[`ModalSurfaceProps`](ModalSurfaceProps.md).[`dismissOnEscape`](ModalSurfaceProps.md#dismissonescape)

***

### dismissOnOutsideClick?

> `optional` **dismissOnOutsideClick**: `boolean`

Defined in: [overlay/Modal.tsx:32](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/overlay/Modal.tsx#L32)

Whether a press on the scrim closes it. Default `true`.

#### Inherited from

[`ModalSurfaceProps`](ModalSurfaceProps.md).[`dismissOnOutsideClick`](ModalSurfaceProps.md#dismissonoutsideclick)

***

### footer?

> `optional` **footer**: `ReactNode`

Defined in: [overlay/Modal.tsx:30](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/overlay/Modal.tsx#L30)

Pinned to the bottom of the surface — actions, usually.

#### Inherited from

[`ModalSurfaceProps`](ModalSurfaceProps.md).[`footer`](ModalSurfaceProps.md#footer)

***

### initialFocusRef?

> `optional` **initialFocusRef**: `RefObject`\<`null` \| `HTMLElement`\>

Defined in: [overlay/Modal.tsx:46](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/overlay/Modal.tsx#L46)

What to focus on open. Defaults to the first focusable element in the surface.

#### Remarks

Worth setting for a destructive confirmation, where the first focusable element is usually
the button you least want a stray Enter to press.

#### Inherited from

[`ModalSurfaceProps`](ModalSurfaceProps.md).[`initialFocusRef`](ModalSurfaceProps.md#initialfocusref)

***

### onClose()

> **onClose**: () => `void`

Defined in: [overlay/Modal.tsx:16](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/overlay/Modal.tsx#L16)

Called when the user asks to close — Escape, the scrim, or the close button.

#### Returns

`void`

#### Inherited from

[`ModalSurfaceProps`](ModalSurfaceProps.md).[`onClose`](ModalSurfaceProps.md#onclose)

***

### open

> **open**: `boolean`

Defined in: [overlay/Modal.tsx:14](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/overlay/Modal.tsx#L14)

Whether the surface is on screen. These are controlled components; there is no internal open state.

#### Inherited from

[`ModalSurfaceProps`](ModalSurfaceProps.md).[`open`](ModalSurfaceProps.md#open)

***

### showCloseButton?

> `optional` **showCloseButton**: `boolean`

Defined in: [overlay/Modal.tsx:36](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/overlay/Modal.tsx#L36)

Whether to render the close button in the header. Default `true`.

#### Inherited from

[`ModalSurfaceProps`](ModalSurfaceProps.md).[`showCloseButton`](ModalSurfaceProps.md#showclosebutton)

***

### size?

> `optional` **size**: [`DialogSize`](../type-aliases/DialogSize.md)

Defined in: [overlay/Modal.tsx:54](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/overlay/Modal.tsx#L54)

Width step. `full` fills the viewport minus a margin.

***

### title

> **title**: `ReactNode`

Defined in: [overlay/Modal.tsx:25](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/overlay/Modal.tsx#L25)

The accessible name, rendered in the header.

#### Remarks

Required rather than optional. A modal with no name is announced as "dialog" and nothing
else, which is the single most common accessibility failure in this component. Wrap it in
`VisuallyHidden` if the design calls for no visible heading.

#### Inherited from

[`ModalSurfaceProps`](ModalSurfaceProps.md).[`title`](ModalSurfaceProps.md#title)
