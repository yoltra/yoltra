![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

[**@yoltra/core**](../README.md)

***

[@yoltra/core](../README.md) / Scheduler

# Interface: Scheduler

Defined in: [types.ts:642](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L642)

Where a store arms its timers.

## Remarks

Called as methods, so a class instance keeps its `this`. `clearTimeout` receives exactly what
`setTimeout` returned.

## Methods

### clearTimeout()

> **clearTimeout**(`handle`): `void`

Defined in: [types.ts:646](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L646)

Cancels a timer that has not fired yet.

#### Parameters

##### handle

[`TimerHandle`](../type-aliases/TimerHandle.md)

#### Returns

`void`

***

### setTimeout()

> **setTimeout**(`callback`, `delayMs`): [`TimerHandle`](../type-aliases/TimerHandle.md)

Defined in: [types.ts:644](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L644)

Runs `callback` once, after `delayMs` milliseconds.

#### Parameters

##### callback

() => `void`

##### delayMs

`number`

#### Returns

[`TimerHandle`](../type-aliases/TimerHandle.md)
