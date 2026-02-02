[**@quojs/core**](../README.md)

***

[@quojs/core](../README.md) / EventPhase

# Type Alias: EventPhase

> **EventPhase** = `"committed"` \| `"uncommitted"` \| `"all"`

Defined in: [types.ts:609](https://github.com/quojs/quojs/blob/d7e7368223439ffec372ae1e5232d6f03b0a0e1f/packages/core/src/types.ts#L609)

Phase of event subscription notification.

- `'committed'`: Events that passed middleware and reached reducers (default)
- `'uncommitted'`: Events rejected by middleware
- `'all'`: Both committed and uncommitted events
