![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

[**@yoltra/core**](../README.md)

***

[@yoltra/core](../README.md) / EffectContext

# Interface: EffectContext

Defined in: [types.ts:1671](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L1671)

What an effect receives about its own registration.

## Properties

### signal

> `readonly` **signal**: `AbortSignal`

Defined in: [types.ts:1684](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L1684)

Aborted when this effect stops being registered: its disposer ran, `replaceEffects` or
`hotReplace` removed it, or the store was disposed.

#### Remarks

Hand it to work the effect starts, such as a `fetch`, so a reload or an unmount cancels the
request instead of letting it land in a store that no longer wants it. Created on first
read, and shared by every event the registration handles. An effect that is still running
when it aborts is not stopped, and what it emits afterwards is not dropped: unregistering an
effect is not the end of the store. Check `signal.aborted` before emitting a result that only
made sense while the effect was installed.
