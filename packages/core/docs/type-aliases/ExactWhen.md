![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

[**@yoltra/core**](../README.md)

***

[@yoltra/core](../README.md) / ExactWhen

# Type Alias: ExactWhen\<EM\>

> **ExactWhen**\<`EM`\> = `Exclude`\<[`When`](When.md)\<`EM`\>, \{ `channelPattern`: `string`; \}\>

Defined in: [types.ts:1800](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L1800)

The exact forms of [When](When.md): every form but `channelPattern`. What reducers and effects
accept.

## Type Parameters

### EM

`EM` *extends* [`EventMapBase`](EventMapBase.md)

Event map.

## Remarks

Exact rather than pattern-matched on purpose, and refused rather than ignored: before 0.10.0 a
reducer or effect given a `channelPattern` registered without complaint and then handled
nothing at all.
