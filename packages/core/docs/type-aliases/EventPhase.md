[**@quojs/core**](../README.md)

***

[@quojs/core](../README.md) / EventPhase

# Type Alias: EventPhase

> **EventPhase** = `"committed"` \| `"uncommitted"` \| `"all"`

Defined in: [types.ts:977](https://github.com/quojs/quojs/blob/7a847d68175722f00e52941458a1511185cf0a4e/packages/core/src/types.ts#L977)

Phase of event subscription notification.

- `'committed'`: Events that passed middleware and reached reducers (default)
- `'uncommitted'`: Events rejected by middleware
- `'all'`: Both committed and uncommitted events
