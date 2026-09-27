![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

[**@yoltra/ds**](../../README.md)

***

[@yoltra/ds](../../README.md) / [client](../README.md) / TabsProps

# Interface: TabsProps

Defined in: [primitives/Tabs/Tabs.tsx:11](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/primitives/Tabs/Tabs.tsx#L11)

## Properties

### activation?

> `optional` **activation**: `"automatic"` \| `"manual"`

Defined in: [primitives/Tabs/Tabs.tsx:25](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/primitives/Tabs/Tabs.tsx#L25)

How arrow keys behave.

#### Remarks

`"automatic"`, the default, moves the selection with the focus, which is what the ARIA
practices recommend when a panel is cheap to render: one key press, one result.

`"manual"` moves focus only, and selection waits for Enter, Space or a click. It exists for
the case the recommendation carves out, a panel expensive enough that arrowing past three of
them to reach the fourth would fetch three things nobody asked for.

***

### defaultId?

> `optional` **defaultId**: `string`

Defined in: [primitives/Tabs/Tabs.tsx:13](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/primitives/Tabs/Tabs.tsx#L13)

***

### items

> **items**: [`TabItem`](TabItem.md)[]

Defined in: [primitives/Tabs/Tabs.tsx:12](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/primitives/Tabs/Tabs.tsx#L12)
