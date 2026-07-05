[**@yoltra/core**](../README.md)

***

[@yoltra/core](../README.md) / MiddlewareInput

# Type Alias: MiddlewareInput\<S, EM\>

> **MiddlewareInput**\<`S`, `EM`\> = [`MiddlewareFunction`](MiddlewareFunction.md)\<`S`, `EM`\> \| [`MiddlewareSpec`](../interfaces/MiddlewareSpec.md)\<`S`, `EM`\>

Defined in: [types.ts:251](https://github.com/yoltra/yoltra/blob/ae94dea5790844eac37ee002f0fbed302029371e/packages/core/src/types.ts#L251)

Middleware input: accepts either a function (legacy) or a spec object (recommended).

## Type Parameters

### S

`S` = `any`

Store state (readonly).

### EM

`EM` *extends* [`EventMapBase`](EventMapBase.md) = [`EventMapBase`](EventMapBase.md)

Event map.

## Examples

```ts
const mw: MiddlewareInput<AppState, AppEM> = (state, event, emit) => {
  console.log(event.type);
  return true;
};
```

```ts
const mw: MiddlewareInput<AppState, AppEM> = {
  when: { channel: 'admin' },
  middleware: (state, event, emit) => state.auth.isAdmin,
  meta: { type: 'middleware', name: 'authGuard' },
};
```
