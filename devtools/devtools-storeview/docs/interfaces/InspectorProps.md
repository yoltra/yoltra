![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

[**@yoltra/devtools-storeview**](../README.md)

***

[@yoltra/devtools-storeview](../README.md) / InspectorProps

# Interface: InspectorProps

Defined in: [devtools-storeview/src/components/panels/Inspector.tsx:18](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-storeview/src/components/panels/Inspector.tsx#L18)

Props for [Inspector](../functions/Inspector.md).

## Properties

### canEmit?

> `optional` **canEmit**: `boolean`

Defined in: [devtools-storeview/src/components/panels/Inspector.tsx:22](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-storeview/src/components/panels/Inspector.tsx#L22)

Whether the store accepts emitted events.

***

### entries

> **entries**: `EventLogEntry`[]

Defined in: [devtools-storeview/src/components/panels/Inspector.tsx:20](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-storeview/src/components/panels/Inspector.tsx#L20)

Event log entries to display (newest last).

***

### onEmit()?

> `optional` **onEmit**: (`channel`, `type`, `payload`) => `void`

Defined in: [devtools-storeview/src/components/panels/Inspector.tsx:24](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-storeview/src/components/panels/Inspector.tsx#L24)

Callback to dispatch an event to the store.

#### Parameters

##### channel

`string`

##### type

`string`

##### payload

`unknown`

#### Returns

`void`
