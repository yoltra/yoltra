![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

[**@yoltra/core**](../README.md)

***

[@yoltra/core](../README.md) / NotCommittedReason

# Type Alias: NotCommittedReason

> **NotCommittedReason** = `"vetoed"` \| `"deduped"` \| `"cascade"`

Defined in: [types.ts:259](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L259)

Why an event did not commit.

## Remarks

- `vetoed` - middleware returned `false`, or threw.
- `deduped` - an identical event was seen inside the dedup window.
- `cascade` - the event exceeded `maxReduceDepth` or the per-drain transition ceiling, so
  the store refused it rather than letting a cycle run away.
