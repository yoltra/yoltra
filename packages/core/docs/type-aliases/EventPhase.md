![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

[**@yoltra/core**](../README.md)

***

[@yoltra/core](../README.md) / EventPhase

# Type Alias: EventPhase

> **EventPhase** = `"committed"` \| `"uncommitted"` \| `"all"`

Defined in: [types.ts:1265](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L1265)

Phase of event subscription notification.

- `'committed'`: Events that passed middleware and reached reducers (default)
- `'uncommitted'`: Events rejected by middleware
- `'all'`: Both committed and uncommitted events
