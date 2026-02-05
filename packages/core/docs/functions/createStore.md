[**@quojs/core**](../README.md)

***

[@quojs/core](../README.md) / createStore

# Function: createStore()

## Call Signature

> **createStore**\<`S`, `EM`\>(`cfg`): [`StoreInstance`](../interfaces/StoreInstance.md)\<keyof `S` & `string`, `S`, `EM`\>

Defined in: [store/Store.ts:1639](https://github.com/quojs/quojs/blob/3a7e48ef6dc2bf6db713ff04100a2a0e1ee72ff5/packages/core/src/store/Store.ts#L1639)

Creates a store with explicit State and EventMap types.

Use this overload for:
- **Event-only stores** (no reducers, just middleware/effects)
- When TypeScript inference from reducers isn't sufficient
- When you want to define the EventMap independently of reducers

### Type Parameters

#### S

`S` *extends* `Record`\<`string`, `any`\>

State record type (can be empty `{}` for event-only stores).

#### EM

`EM` *extends* [`EventMapBase`](../type-aliases/EventMapBase.md)

Event map type defining all `channel → type → payload` combinations.

### Parameters

#### cfg

Configuration with `name`, optional `reducer`, optional `middleware`, optional `effects`.

##### effects?

[`EffectSpec`](../interfaces/EffectSpec.md)\<[`DeepReadonly`](../type-aliases/DeepReadonly.md)\<`S`\>, `EM`\>[]

##### middleware?

[`MiddlewareFunction`](../type-aliases/MiddlewareFunction.md)\<[`DeepReadonly`](../type-aliases/DeepReadonly.md)\<`S`\>, `EM`\>[]

##### name

`string`

##### reducer?

\{ \[K in string \| number \| symbol\]?: ReducerSpec\<S\[K\], EM\> \}

### Returns

[`StoreInstance`](../interfaces/StoreInstance.md)\<keyof `S` & `string`, `S`, `EM`\>

A typed [StoreInstance](../interfaces/StoreInstance.md).

### Examples

```ts
type AppEM = {
  notifications: { show: { message: string }; hide: void };
};

const store = createStore<{}, AppEM>({
  name: 'NotificationBus',
  effects: [{
    when: { channel: 'notifications' },
    effect: (evt) => {
      if (evt.type === 'show') showToast(evt.payload.message);
    },
  }],
});
```

```ts
const store = createStore<AppState, AppEM>({
  name: 'App',
  reducer: { counter: counterSpec },
  middleware: [loggingMiddleware],
});
```

## Call Signature

> **createStore**\<`RM`\>(`cfg`): [`StoreInstance`](../interfaces/StoreInstance.md)\<keyof `RM` & `string`, `StateFromReducers`\<`RM`\>, `EMFromReducersStrict`\<`RM`\>\>

Defined in: [store/Store.ts:1677](https://github.com/quojs/quojs/blob/3a7e48ef6dc2bf6db713ff04100a2a0e1ee72ff5/packages/core/src/store/Store.ts#L1677)

Creates a store with types inferred from the reducers map.

This is the primary overload for most use cases where reducers define
both the state shape and the event map.

### Type Parameters

#### RM

`RM` *extends* `ReducersMapAny`

Reducers map object with each slice's `ReducerSpec`.

### Parameters

#### cfg

Configuration with `name`, `reducer`, optional `middleware`, optional `effects`.

##### effects?

[`EffectSpec`](../interfaces/EffectSpec.md)\<[`DeepReadonly`](../type-aliases/DeepReadonly.md)\<`StateFromReducers`\<`RM`\>\>, `EMFromReducersStrict`\<`RM`\>\>[]

##### middleware?

[`MiddlewareFunction`](../type-aliases/MiddlewareFunction.md)\<[`DeepReadonly`](../type-aliases/DeepReadonly.md)\<`StateFromReducers`\<`RM`\>\>, `EMFromReducersStrict`\<`RM`\>\>[]

##### name

`string`

##### reducer

`RM`

### Returns

[`StoreInstance`](../interfaces/StoreInstance.md)\<keyof `RM` & `string`, `StateFromReducers`\<`RM`\>, `EMFromReducersStrict`\<`RM`\>\>

A typed [StoreInstance](../interfaces/StoreInstance.md).

### Example

```ts
const store = createStore({
  name: 'App',
  reducer: {
    counter: {
      state: { value: 0 },
      when: { keys: eventKeys<MyEM>()([['ui', 'increment']]) },
      reducer: (s, evt) => evt.type === 'increment' ? { value: s.value + evt.payload } : s
    }
  },
  middleware: [],
  effects: []
});
```
