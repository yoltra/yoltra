![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

[**@yoltra/core**](../README.md)

***

[@yoltra/core](../README.md) / warnOnLargeValues

# Function: warnOnLargeValues()

> **warnOnLargeValues**(`store`, `limits`): [`Unsubscribe`](../type-aliases/Unsubscribe.md)

Defined in: [diagnostics/warnOnLargeValues.ts:112](https://github.com/yoltra/yoltra/blob/main/packages/core/src/diagnostics/warnOnLargeValues.ts#L112)

Warns, in development, when an event payload or a slice grows past a limit.

## Parameters

### store

[`SizeWatchedStore`](../interfaces/SizeWatchedStore.md)

### limits

[`LargeValueLimits`](../interfaces/LargeValueLimits.md) = `{}`

## Returns

[`Unsubscribe`](../type-aliases/Unsubscribe.md)

A function that stops watching. In production it watches nothing and returns a no-op.

## Remarks

Checks each committed event's payload, and each slice the event changed. Warns once per event
key and once per slice, naming the store, the value and the limit it passed. Registered with
`{ ephemeral: true }`, so traffic on an ephemeral channel is checked too.

## Example

```ts
if (import.meta.env.DEV) warnOnLargeValues(store, { maxSliceNodes: 20_000 });
```
