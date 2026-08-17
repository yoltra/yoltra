![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

[**@yoltra/core**](../README.md)

***

[@yoltra/core](../README.md) / Rejected

# Function: Rejected()

> **Rejected**(`reason`): [`Rejection`](../interfaces/Rejection.md)

Defined in: [store/rejection.ts:54](https://github.com/yoltra/yoltra/blob/main/packages/core/src/store/rejection.ts#L54)

Builds a [Rejection](../interfaces/Rejection.md) for a reducer to return instead of state.

## Parameters

### reason

`string`

Why the write is refused; surfaced verbatim to the caller.

## Returns

[`Rejection`](../interfaces/Rejection.md)

## Remarks

Rejecting is a whole-event act: no slice commits, no change notifications fire, and the
caller's `emit` resolves reporting the refusal. A reducer that merely has nothing to do should
return its state, not this.

## Example

```ts
reducer: (state, event) =>
  event.payload.expectedVersion === state.version
    ? { ...state, ...event.payload.patch, version: state.version + 1 }
    : Rejected(`stale write: expected v${event.payload.expectedVersion}, have v${state.version}`)
```
