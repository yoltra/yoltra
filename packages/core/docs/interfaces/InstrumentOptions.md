![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

[**@yoltra/core**](../README.md)

***

[@yoltra/core](../README.md) / InstrumentOptions

# Interface: InstrumentOptions

Defined in: [types.ts:477](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L477)

Options for [StoreInstance.instrument](StoreInstance.md#instrument).

## Properties

### ephemeral?

> `readonly` `optional` **ephemeral**: `boolean`

Defined in: [types.ts:488](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L488)

Also receive events on [StoreSpec.ephemeral](../type-aliases/StoreSpec.md#ephemeral) channels.

#### Remarks

Off by default, so an observer that records history (a devtools timeline, an audit trail)
never pays for traffic. Turn it on for an observer that must see every state change whatever
caused it, such as persistence.

#### Default

```ts
false
```
