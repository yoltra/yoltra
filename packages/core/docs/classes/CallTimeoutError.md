![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

[**@yoltra/core**](../README.md)

***

[@yoltra/core](../README.md) / CallTimeoutError

# Class: CallTimeoutError

Defined in: [store/call.ts:132](https://github.com/yoltra/yoltra/blob/main/packages/core/src/store/call.ts#L132)

Raised when a call goes [CallOptions.timeoutMs](../interfaces/CallOptions.md#timeoutms) without a correlated event.

## Extends

- `Error`

## Constructors

### Constructor

> **new CallTimeoutError**(`channel`, `type`, `idleMs`): `CallTimeoutError`

Defined in: [store/call.ts:137](https://github.com/yoltra/yoltra/blob/main/packages/core/src/store/call.ts#L137)

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

Defined in: [store/call.ts:133](https://github.com/yoltra/yoltra/blob/main/packages/core/src/store/call.ts#L133)

***

### idleMs

> `readonly` **idleMs**: `number`

Defined in: [store/call.ts:135](https://github.com/yoltra/yoltra/blob/main/packages/core/src/store/call.ts#L135)

***

### type

> `readonly` **type**: `string`

Defined in: [store/call.ts:134](https://github.com/yoltra/yoltra/blob/main/packages/core/src/store/call.ts#L134)
