![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

[**@yoltra/devtools-storeview**](../README.md)

***

[@yoltra/devtools-storeview](../README.md) / EventEmitterPanel

# Function: EventEmitterPanel()

> **EventEmitterPanel**(`__namedParameters`): `Element`

Defined in: [devtools-storeview/src/components/panels/EventEmitter.tsx:72](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-storeview/src/components/panels/EventEmitter.tsx#L72)

Form to emit events to a store.

Provides channel, type, and JSON payload fields. Validates that
channel and type are non-empty and that the payload is valid JSON
before invoking the `onEmit` callback.

## Parameters

### \_\_namedParameters

#### onEmit

(`channel`, `type`, `payload`) => `void`

## Returns

`Element`
