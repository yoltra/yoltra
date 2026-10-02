![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

[**@yoltra/core**](../README.md)

***

[@yoltra/core](../README.md) / Decoration

# Interface: Decoration\<AddS, AddEM\>

Defined in: [types.ts:2413](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L2413)

What a decoration contributes to a store: some slices, some events, either possibly empty.

## Remarks

Phantom. Never constructed, and never present at runtime; it exists so a library can state
its contribution once and have [Decorated](../type-aliases/Decorated.md) and [StoreDecorator](../type-aliases/StoreDecorator.md) read it back.

## Example

```ts
type FlagsDecoration = Decoration<{ flags: FlagsState }, FlagsEM>;
```

## Type Parameters

### AddS

`AddS` *extends* `Record`\<`string`, `any`\> = `Record`\<`never`, `never`\>

### AddEM

`AddEM` *extends* [`EventMapBase`](../type-aliases/EventMapBase.md) = [`EmptyEventMap`](../type-aliases/EmptyEventMap.md)

## Properties

### events

> `readonly` **events**: `AddEM`

Defined in: [types.ts:2418](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L2418)

***

### slices

> `readonly` **slices**: `AddS`

Defined in: [types.ts:2417](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L2417)
