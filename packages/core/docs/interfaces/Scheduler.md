![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

[**@yoltra/core**](../README.md)

***

[@yoltra/core](../README.md) / Scheduler

# Interface: Scheduler

Defined in: [types.ts:560](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L560)

Where a store arms its timers.

## Remarks

Called as methods, so a class instance keeps its `this`. `clearTimeout` receives exactly what
`setTimeout` returned.

## Methods

### clearTimeout()

> **clearTimeout**(`handle`): `void`

Defined in: [types.ts:564](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L564)

Cancels a timer that has not fired yet.

#### Parameters

##### handle

[`TimerHandle`](../type-aliases/TimerHandle.md)

#### Returns

`void`

***

### setTimeout()

> **setTimeout**(`callback`, `delayMs`): [`TimerHandle`](../type-aliases/TimerHandle.md)

Defined in: [types.ts:562](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L562)

Runs `callback` once, after `delayMs` milliseconds.

#### Parameters

##### callback

() => `void`

##### delayMs

`number`

#### Returns

[`TimerHandle`](../type-aliases/TimerHandle.md)
