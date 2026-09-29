![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

[**@yoltra/ds**](../../README.md)

***

[@yoltra/ds](../../README.md) / [client](../README.md) / DismissOptions

# Interface: DismissOptions

Defined in: [overlay/hooks.ts:96](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/overlay/hooks.ts#L96)

## Properties

### active

> **active**: `boolean`

Defined in: [overlay/hooks.ts:98](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/overlay/hooks.ts#L98)

Whether this layer is currently open.

***

### closeOnEscape?

> `optional` **closeOnEscape**: `boolean`

Defined in: [overlay/hooks.ts:102](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/overlay/hooks.ts#L102)

***

### closeOnOutsideClick?

> `optional` **closeOnOutsideClick**: `boolean`

Defined in: [overlay/hooks.ts:103](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/overlay/hooks.ts#L103)

***

### onDismiss()

> **onDismiss**: () => `void`

Defined in: [overlay/hooks.ts:99](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/overlay/hooks.ts#L99)

#### Returns

`void`

***

### refs

> **refs**: `RefObject`\<`null` \| `HTMLElement`\>[]

Defined in: [overlay/hooks.ts:101](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/overlay/hooks.ts#L101)

Elements that count as "inside": the panel, and for an anchored layer its trigger.
