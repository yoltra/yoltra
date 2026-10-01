![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

[**@yoltra/core**](../README.md)

***

[@yoltra/core](../README.md) / CallTimeoutError

# Class: CallTimeoutError

Defined in: [store/call.ts:165](https://github.com/yoltra/yoltra/blob/main/packages/core/src/store/call.ts#L165)

Raised when a call goes [CallOptions.timeoutMs](../interfaces/CallOptions.md#timeoutms) without a correlated event.

## Extends

- `Error`

## Constructors

### Constructor

> **new CallTimeoutError**(`channel`, `type`, `idleMs`): `CallTimeoutError`

Defined in: [store/call.ts:170](https://github.com/yoltra/yoltra/blob/main/packages/core/src/store/call.ts#L170)

#### Parameters

##### channel

`string`

##### type

`string`

##### idleMs

`number`

#### Returns

`CallTimeoutError`

#### Overrides

`Error.constructor`

## Properties

### channel

> `readonly` **channel**: `string`

Defined in: [store/call.ts:166](https://github.com/yoltra/yoltra/blob/main/packages/core/src/store/call.ts#L166)

***

### idleMs

> `readonly` **idleMs**: `number`

Defined in: [store/call.ts:168](https://github.com/yoltra/yoltra/blob/main/packages/core/src/store/call.ts#L168)

***

### type

> `readonly` **type**: `string`

Defined in: [store/call.ts:167](https://github.com/yoltra/yoltra/blob/main/packages/core/src/store/call.ts#L167)
