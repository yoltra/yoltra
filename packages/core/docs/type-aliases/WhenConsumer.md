![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

[**@yoltra/core**](../README.md)

***

[@yoltra/core](../README.md) / WhenConsumer

# Type Alias: WhenConsumer

> **WhenConsumer** = `"reducer"` \| `"effect"` \| `"middleware"`

Defined in: [store/matching.ts:100](https://github.com/yoltra/yoltra/blob/main/packages/core/src/store/matching.ts#L100)

What kind of consumer a `when` matcher is being registered for. Reducers and effects take
exact matchers only; middleware also takes `channelPattern`.
