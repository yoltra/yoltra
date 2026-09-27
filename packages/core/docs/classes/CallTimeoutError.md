![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

[**@yoltra/core**](../README.md)

***

[@yoltra/core](../README.md) / CallTimeoutError

# Class: CallTimeoutError

Defined in: [store/call.ts:136](https://github.com/yoltra/yoltra/blob/main/packages/core/src/store/call.ts#L136)

Raised when a call goes [CallOptions.timeoutMs](../interfaces/CallOptions.md#timeoutms) without a correlated event.

## Extends

- `Error`

## Constructors

### Constructor

> **new CallTimeoutError**(`channel`, `type`, `idleMs`): `CallTimeoutError`

Defined in: [store/call.ts:141](https://github.com/yoltra/yoltra/blob/main/packages/core/src/store/call.ts#L141)

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

Defined in: [store/call.ts:137](https://github.com/yoltra/yoltra/blob/main/packages/core/src/store/call.ts#L137)

***

### idleMs

> `readonly` **idleMs**: `number`

Defined in: [store/call.ts:139](https://github.com/yoltra/yoltra/blob/main/packages/core/src/store/call.ts#L139)

***

### type

> `readonly` **type**: `string`

Defined in: [store/call.ts:138](https://github.com/yoltra/yoltra/blob/main/packages/core/src/store/call.ts#L138)
