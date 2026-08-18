![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

[**@yoltra/core**](../README.md)

***

[@yoltra/core](../README.md) / NotifiedPhase

# Type Alias: NotifiedPhase

> **NotifiedPhase** = `Exclude`\<[`EventPhase`](EventPhase.md), `"all"`\>

Defined in: [types.ts:1557](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L1557)

The phases a handler is actually *told about*.

## Remarks

`'all'` is a subscription selector, not an outcome — nothing is ever delivered "in the all
phase". Naming the difference keeps the two from being conflated in a handler signature, which
is where they were previously spelled out by hand and drifted: adding `'written'` to
[EventPhase](EventPhase.md) left three copies in `@yoltra/react` still claiming a handler could only
ever see two phases, and the build failed on the mismatch.
