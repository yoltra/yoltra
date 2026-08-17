![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

[**@yoltra/core**](../README.md)

***

[@yoltra/core](../README.md) / ConnectOptions

# Interface: ConnectOptions

Defined in: [types.ts:231](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L231)

Options for [StoreInstance.connect](StoreInstance.md#connect).

## Properties

### immediate?

> `readonly` `optional` **immediate**: `boolean`

Defined in: [types.ts:246](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L246)

Deliver the current value once, immediately, before any change arrives.

#### Remarks

A subscription otherwise starts at "from now on", so a subscriber's first render has to read
the path separately — the same path, spelled twice, which is one place for them to drift.

The synthetic change has `oldValue: undefined` and no `eventId`, `channel` or `type`: no
event caused it, and claiming one would be a lie a subscriber could act on.

For a wildcard pattern the "current value" of a match set is not a thing, so the slice root
is delivered with `path: ""`. React's hooks do not need this at all — `useSyncExternalStore`
already reads a snapshot on mount — so it is aimed at imperative subscribers.
