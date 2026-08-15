![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

[**@yoltra/ds**](../../README.md)

***

[@yoltra/ds](../../README.md) / [client](../README.md) / MenuItemProps

# Interface: MenuItemProps

Defined in: [overlay/Popover.tsx:224](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/overlay/Popover.tsx#L224)

## Properties

### children

> **children**: `ReactNode`

Defined in: [overlay/Popover.tsx:236](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/overlay/Popover.tsx#L236)

***

### className?

> `optional` **className**: `string`

Defined in: [overlay/Popover.tsx:237](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/overlay/Popover.tsx#L237)

***

### disabled?

> `optional` **disabled**: `boolean`

Defined in: [overlay/Popover.tsx:235](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/overlay/Popover.tsx#L235)

Announced and skipped on activation, but still reachable with the arrow keys.

#### Remarks

`aria-disabled` rather than the `disabled` attribute, deliberately. A `disabled` item is
removed from the tab order entirely, so a keyboard user cannot find out that the action
exists at all — which is worse than being told it is unavailable.

***

### onSelect()?

> `optional` **onSelect**: () => `void`

Defined in: [overlay/Popover.tsx:226](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/overlay/Popover.tsx#L226)

Runs when the item is chosen, by click or by Enter/Space.

#### Returns

`void`
