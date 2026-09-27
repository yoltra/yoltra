![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

[**@yoltra/core**](../README.md)

***

[@yoltra/core](../README.md) / ReplaceScope

# Type Alias: ReplaceScope

> **ReplaceScope** = `"spec"` \| `"all"`

Defined in: [types.ts:1910](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L1910)

Which registrations a `replace*` call is allowed to remove.

## Remarks

`"spec"` is the default and replaces only what the application authored. `"all"` restores
the pre-0.8.0 behaviour exactly, for a caller that genuinely wants it, such as a test
harness resetting a store between cases. `internal` registrations survive both.
