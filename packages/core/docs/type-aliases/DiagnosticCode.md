![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

[**@yoltra/core**](../README.md)

***

[@yoltra/core](../README.md) / DiagnosticCode

# Type Alias: DiagnosticCode

> **DiagnosticCode** = `"effect-error"` \| `"reducer-error"` \| `"subscriber-error"` \| `"connect-error"` \| `"middleware-error"` \| `"observer-error"` \| `"emit-error"` \| `"slice-teardown-error"` \| `"cascade"` \| `"rejected"` \| `"registration-cascade"` \| `"key-collision"` \| `"payload-by-reference"` \| `"dotted-key"` \| `"snapshot-missing-slice"` \| `"middleware-promise"` \| `"observer-promise"` \| `"use-after-dispose"`

Defined in: [types.ts:587](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L587)

The stable identifier of a [Diagnostic](../interfaces/Diagnostic.md), for routing and filtering.

## Remarks

Failures the store contained:
- `effect-error`, `reducer-error`, `subscriber-error` (an `onEvent` handler), `connect-error`
  (a `connect` handler), `middleware-error` (a middleware threw, which vetoes the event)
- `observer-error`: an instrumentation or registration observer, or a hook, threw
- `emit-error`: the reduce phase failed outside any one consumer
- `slice-teardown-error`: a disposer threw while a slice was unregistered

Refusals: `cascade` (a causal chain exceeded its ceiling), `rejected` (a reducer declined the
write; level `info`, since a refusal is a normal outcome), `registration-cascade`.

Development warnings, never sent in production: `key-collision`, `payload-by-reference`,
`dotted-key`, `snapshot-missing-slice`, `middleware-promise`, `observer-promise`,
`use-after-dispose` (an `emit` or `call` on a disposed store).
