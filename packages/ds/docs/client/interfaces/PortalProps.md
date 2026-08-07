[**@yoltra/ds**](../../README.md)

***

[@yoltra/ds](../../README.md) / [client](../README.md) / PortalProps

# Interface: PortalProps

Defined in: [overlay/Portal.tsx:6](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/overlay/Portal.tsx#L6)

## Properties

### children

> **children**: `ReactNode`

Defined in: [overlay/Portal.tsx:7](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/overlay/Portal.tsx#L7)

***

### container?

> `optional` **container**: `null` \| `HTMLElement`

Defined in: [overlay/Portal.tsx:15](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/overlay/Portal.tsx#L15)

Where to mount. Defaults to `document.body`.

#### Remarks

Worth overriding for a page rendered inside a shadow root or a modal-in-a-modal host, and
for tests that want the mounted node scoped to the fixture rather than the document.
