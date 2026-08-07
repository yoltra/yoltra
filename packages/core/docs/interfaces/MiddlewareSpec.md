[**@yoltra/core**](../README.md)

***

[@yoltra/core](../README.md) / MiddlewareSpec

# Interface: MiddlewareSpec\<S, EM\>

Defined in: [types.ts:889](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L889)

Middleware specification with optional event targeting and metadata.

## Remarks

- If `when` is omitted, middleware receives ALL events.
- Use `when` to filter which events the middleware processes.
- Middleware runs BEFORE reducers and can cancel event propagation.

## Examples

```ts
const loggingMiddleware: MiddlewareSpec<AppState, AppEM> = {
  middleware: (state, event, emit) => {
    console.log('Event:', event.channel, event.type);
    return true; // allow propagation
  },
  meta: { type: 'middleware', name: 'logger' },
};
```

```ts
const authMiddleware: MiddlewareSpec<AppState, AppEM> = {
  when: { channel: 'admin' },
  middleware: (state, event, emit) => {
    if (!state.auth.isAdmin) return false; // cancel
    return true;
  },
  meta: { type: 'middleware', name: 'authGuard', description: 'Guards admin events' },
};
```

## Type Parameters

### S

`S` = `any`

Store state (readonly).

### EM

`EM` *extends* [`EventMapBase`](../type-aliases/EventMapBase.md) = [`EventMapBase`](../type-aliases/EventMapBase.md)

Event map.

## Properties

### meta?

> `optional` **meta**: [`EventConsumerMeta`](EventConsumerMeta.md)\<`"middleware"`\>

Defined in: [types.ts:904](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L904)

Optional metadata for debugging tools and DevTools integration.

***

### middleware

> **middleware**: [`MiddlewareFunction`](../type-aliases/MiddlewareFunction.md)\<`S`, `EM`\>

Defined in: [types.ts:899](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L899)

Middleware function: `(state, event, emit) => boolean` (synchronous).
Return `false` to cancel event propagation.

***

### when?

> `optional` **when**: [`When`](../type-aliases/When.md)\<`EM`\>

Defined in: [types.ts:893](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L893)

Event targeting (optional). If omitted, middleware receives ALL events.
