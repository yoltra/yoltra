[**@quojs/core**](../README.md)

***

[@quojs/core](../README.md) / MiddlewareSpec

# Interface: MiddlewareSpec\<S, EM\>

Defined in: [types.ts:599](https://github.com/quojs/quojs/blob/3a7e48ef6dc2bf6db713ff04100a2a0e1ee72ff5/packages/core/src/types.ts#L599)

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

Defined in: [types.ts:614](https://github.com/quojs/quojs/blob/3a7e48ef6dc2bf6db713ff04100a2a0e1ee72ff5/packages/core/src/types.ts#L614)

Optional metadata for debugging tools and DevTools integration.

***

### middleware

> **middleware**: [`MiddlewareFunction`](../type-aliases/MiddlewareFunction.md)\<`S`, `EM`\>

Defined in: [types.ts:609](https://github.com/quojs/quojs/blob/3a7e48ef6dc2bf6db713ff04100a2a0e1ee72ff5/packages/core/src/types.ts#L609)

Middleware function: `(state, event, emit) => boolean | Promise<boolean>`.
Return `false` to cancel event propagation.

***

### when?

> `optional` **when**: [`When`](../type-aliases/When.md)\<`EM`\>

Defined in: [types.ts:603](https://github.com/quojs/quojs/blob/3a7e48ef6dc2bf6db713ff04100a2a0e1ee72ff5/packages/core/src/types.ts#L603)

Event targeting (optional). If omitted, middleware receives ALL events.
