![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

[**@yoltra/core**](../README.md)

***

[@yoltra/core](../README.md) / EventPhase

# Type Alias: EventPhase

> **EventPhase** = `"committed"` \| `"uncommitted"` \| `"written"` \| `"all"`

Defined in: [types.ts:1541](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L1541)

Phase of event subscription notification.

- `'committed'`: Events that passed middleware and reached reducers (default)
- `'uncommitted'`: Events rejected by middleware
- `'written'`: Events that actually changed state
- `'all'`: Both committed and uncommitted events

## Remarks

`'committed'` means **not vetoed**, and always has. It fires for an event that passed
middleware whether or not any reducer wrote anything — including every event in a store with
no reducers at all, which is the shape a notification or analytics bus takes. Toasts,
animations and tracking depend on that, so it is not narrowed.

`'written'` is the stricter fact, added rather than substituted: state changed. It fires
**after** the commit, so a subscriber reading `getState()` from it sees the new value — which
is what people tend to assume `'committed'` does.

`'all'` deliberately stays `committed | uncommitted`. Folding `'written'` into it would hand
every existing `'all'` subscriber a second notification per written event and quietly double
their counts.
