![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

[**@yoltra/core**](../README.md)

***

[@yoltra/core](../README.md) / StoreDecorator

# Type Alias: StoreDecorator()\<D\>

> **StoreDecorator**\<`D`\> = \<`R`, `S`, `EM`\>(`store`) => [`Decorated`](Decorated.md)\<`R`, `S`, `EM`, `D`\>

Defined in: [types.ts:2090](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L2090)

The shape a `withX(store, config)` decorator conforms to, with `config` curried away.

## Type Parameters

### D

`D` *extends* [`Decoration`](../interfaces/Decoration.md)\<`any`, `any`\>

## Type Parameters

### R

`R` *extends* `string`

### S

`S` *extends* `Record`\<`R`, `any`\>

### EM

`EM` *extends* [`EventMapBase`](EventMapBase.md)

## Parameters

### store

[`StoreInstance`](../interfaces/StoreInstance.md)\<`R`, `S`, `EM`\>

## Returns

[`Decorated`](Decorated.md)\<`R`, `S`, `EM`, `D`\>

## Remarks

**Generic over the incoming store on purpose**, and that is what makes composition work
rather than a variance rule. `R`, `S` and `EM` are inference sites, so at each call in a
nest TypeScript instantiates them from whatever the argument actually is: an EM-only
decorator nested inside one that also adds a slice infers the already-widened `R` and `S`
and carries them through untouched. Either order composes, and nothing is lost.

Nesting is the composition mechanism; there is no `pipe`. Every decorator takes
`(store, config)`, so each step in a pipe needs a lambda to become unary, which makes
`pipe(store, s => withA(s, cfgA), s => withB(s, cfgB))` **longer** than
`withB(withA(store, cfgA), cfgB)`. A pipe only pays for curried decorators, which would be
a different convention from the one `withDevtools` already set.

A dependency on another decoration needs no registry either: constrain the input.
`EM extends EventMapBase & RequiredEM` fails at the call site naming the channels that are
missing, and still composes, because TypeScript infers `EM` and then checks the constraint.

## Example

```ts
export function withTransfers<
  R extends string,
  S extends Record<R, any>,
  EM extends EventMapBase,
>(store: StoreInstance<R, S, EM>, config: TransfersConfig) {
  return store.withSlice("transfers", defineSlice<TransfersEM>()({ ... }), {
    owner: "@scope/transfers",
  });
}
```
