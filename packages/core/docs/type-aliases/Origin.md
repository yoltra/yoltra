![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

[**@yoltra/core**](../README.md)

***

[@yoltra/core](../README.md) / Origin

# Type Alias: Origin

> **Origin** = `"spec"` \| `"dynamic"` \| `"internal"`

Defined in: [types.ts:1984](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L1984)

Where a registration came from.

## Remarks

The distinction already existed in the API surface and simply was not honoured. `replace*`
exists to replace *what the application authored*; a registration a library made through
`registerReducer` / `registerMiddleware` / `registerEffect` after construction was never in
that set, and no caller of `replaceReducers(myReducers)` means "and also delete the slice
devtools or a decoration mounted".

- `spec` - supplied to `createStore`, or installed by a `replace*` call.
- `dynamic` - registered after construction, which is the only way to decorate a store
  that already exists.
- `internal` - the store's own machinery, currently the reply listener behind
  `store.call()`. Preserved even under `{ scope: "all" }`, because a test harness resetting
  a store between cases never means "and abandon the call that is in flight".

Recorded internally. No public signature takes it, and **no library declares it**: getting
this right must not depend on anyone remembering to pass a string.
