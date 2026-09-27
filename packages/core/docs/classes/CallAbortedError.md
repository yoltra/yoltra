![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

[**@yoltra/core**](../README.md)

***

[@yoltra/core](../README.md) / CallAbortedError

# Class: CallAbortedError

Defined in: [store/call.ts:161](https://github.com/yoltra/yoltra/blob/main/packages/core/src/store/call.ts#L161)

Raised when a call is cancelled, or its [CallOptions.signal](../interfaces/CallOptions.md#signal) aborts.

## Extends

- `Error`

## Constructors

### Constructor

> **new CallAbortedError**(`reason`): `CallAbortedError`

Defined in: [store/call.ts:162](https://github.com/yoltra/yoltra/blob/main/packages/core/src/store/call.ts#L162)

#### Parameters

##### reason

`string`

#### Returns

`CallAbortedError`

#### Overrides

`Error.constructor`
