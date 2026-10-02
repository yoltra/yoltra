![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

[**@yoltra/core**](../README.md)

***

[@yoltra/core](../README.md) / EventFromWhen

# Type Alias: EventFromWhen\<EM, W\>

> **EventFromWhen**\<`EM`, `W`\> = `W` *extends* `object` ? [`EventUnion`](EventUnion.md)\<`EM`\> : `W` *extends* `object` ? `K` *extends* readonly \[infer C, infer T\] ? `C` *extends* keyof `EM` & `string` ? `T` *extends* keyof `EM`\[`C`\] & `string` ? [`Event`](../interfaces/Event.md)\<`EM`, `C`, `T`\> : `never` : `never` : `never` : `W` *extends* `object` ? `C` *extends* keyof `EM` & `string` ? `{ [T in keyof EM[C] & string]: Event<EM, C, T> }`\[keyof `EM`\[`C`\] & `string`\] : `never` : `W` *extends* `object` ? `C` *extends* keyof `EM` & `string` ? `{ [T in keyof EM[C] & string]: Event<EM, C, T> }`\[keyof `EM`\[`C`\] & `string`\] : `never` : `W` *extends* `object` ? [`EventUnion`](EventUnion.md)\<`EM`\> : `never`

Defined in: [types.ts:1969](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L1969)

Extracts the event union from a `When` matcher, for typing a handler from its matcher.

## Type Parameters

### EM

`EM` *extends* [`EventMapBase`](EventMapBase.md)

Event map.

### W

`W` *extends* [`When`](When.md)\<`EM`\>

When matcher type.

## Remarks

`{ channelPattern }` resolves to the whole [EventUnion](EventUnion.md): a pattern is untyped by
construction, and the whole union is exactly what a middleware handler receives, which is the
only consumer a pattern can reach. It used to fall through to `never`.

## Example

```ts
const when = { keys: eventKeys<AppEM>()([["ui", "increment"], ["ui", "reset"]]) };
type Handled = EventFromWhen<AppEM, typeof when>;
// Event<AppEM, "ui", "increment"> | Event<AppEM, "ui", "reset">
```
