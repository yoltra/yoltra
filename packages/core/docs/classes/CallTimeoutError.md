![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

[**@yoltra/core**](../README.md)

***

[@yoltra/core](../README.md) / CallTimeoutError

# Class: CallTimeoutError

Defined in: [store/call.ts:211](https://github.com/yoltra/yoltra/blob/main/packages/core/src/store/call.ts#L211)

Raised when a call goes [CallOptions.timeoutMs](../interfaces/CallOptions.md#timeoutms) without a correlated event.

## Extends

- `Error`

## Constructors

### Constructor

> **new CallTimeoutError**(`channel`, `type`, `idleMs`): `CallTimeoutError`

Defined in: [store/call.ts:216](https://github.com/yoltra/yoltra/blob/main/packages/core/src/store/call.ts#L216)

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

Defined in: [store/call.ts:212](https://github.com/yoltra/yoltra/blob/main/packages/core/src/store/call.ts#L212)

***

### idleMs

> `readonly` **idleMs**: `number`

Defined in: [store/call.ts:214](https://github.com/yoltra/yoltra/blob/main/packages/core/src/store/call.ts#L214)

***

### type

> `readonly` **type**: `string`

Defined in: [store/call.ts:213](https://github.com/yoltra/yoltra/blob/main/packages/core/src/store/call.ts#L213)
