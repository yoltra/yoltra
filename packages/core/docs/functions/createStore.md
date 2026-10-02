![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

[**@yoltra/core**](../README.md)

***

[@yoltra/core](../README.md) / createStore

# Function: createStore()

## Call Signature

> **createStore**\<`S`, `EM`\>(`cfg`): [`StoreInstance`](../interfaces/StoreInstance.md)\<keyof `S` & `string`, `S`, `EM`\>

Defined in: [store/Store.ts:4196](https://github.com/yoltra/yoltra/blob/main/packages/core/src/store/Store.ts#L4196)

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

##### clock?

[`Clock`](../interfaces/Clock.md)

##### dedupWindowMs?

`number`

##### devtools?

\{ `allowReplay?`: `boolean`; \}

##### devtools.allowReplay?

`boolean`

##### diagnostics?

[`DiagnosticSink`](../type-aliases/DiagnosticSink.md)

##### effects?

[`EffectSpec`](../interfaces/EffectSpec.md)\<[`DeepReadonly`](../type-aliases/DeepReadonly.md)\<`S`\>, `EM`\>[]

##### idFactory?

() => `string`

##### maxReduceDepth?

`number`

##### maxTransitionsPerDrain?

`number`

##### middleware?

[`MiddlewareInput`](../type-aliases/MiddlewareInput.md)\<[`DeepReadonly`](../type-aliases/DeepReadonly.md)\<`S`\>, `EM`\>[]

##### name

`string`

##### onCascade?

(`info`) => `void`

##### onEffectError?

(`error`, `event`) => `void`

##### onReducerError?

(`error`, `event`, `slice`) => `void`

##### onRejected?

(`rejection`, `event`, `slice`) => `void`

##### onSubscriberError?

(`error`, `event`, `phase`) => `void`

##### reducer?

\{ \[K in string \| number \| symbol\]?: ReducerSpec\<S\[K\], EM\> \}

##### scheduler?

[`Scheduler`](../interfaces/Scheduler.md)

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

> **createStore**\<`RM`\>(`cfg`): [`StoreInstance`](../interfaces/StoreInstance.md)\<keyof `RM` & `string`, [`StateFromReducers`](../type-aliases/StateFromReducers.md)\<`RM`\>, [`EMFromReducersStrict`](../type-aliases/EMFromReducersStrict.md)\<`RM`\>\>

Defined in: [store/Store.ts:4247](https://github.com/yoltra/yoltra/blob/main/packages/core/src/store/Store.ts#L4247)

Creates a store with types inferred from the reducers map.

This is the primary overload for most use cases where reducers define
both the state shape and the event map.

### Type Parameters

#### RM

`RM` *extends* [`ReducersMapAny`](../type-aliases/ReducersMapAny.md)

Reducers map object with each slice's `ReducerSpec`.

### Parameters

#### cfg

Configuration with `name`, `reducer`, optional `middleware`, optional `effects`.

##### clock?

[`Clock`](../interfaces/Clock.md)

##### dedupWindowMs?

`number`

##### devtools?

\{ `allowReplay?`: `boolean`; \}

##### devtools.allowReplay?

`boolean`

##### diagnostics?

[`DiagnosticSink`](../type-aliases/DiagnosticSink.md)

##### effects?

[`EffectSpec`](../interfaces/EffectSpec.md)\<[`DeepReadonly`](../type-aliases/DeepReadonly.md)\<[`StateFromReducers`](../type-aliases/StateFromReducers.md)\<`RM`\>\>, [`EMFromReducersStrict`](../type-aliases/EMFromReducersStrict.md)\<`RM`\>\>[]

##### idFactory?

() => `string`

##### maxReduceDepth?

`number`

##### maxTransitionsPerDrain?

`number`

##### middleware?

[`MiddlewareInput`](../type-aliases/MiddlewareInput.md)\<[`DeepReadonly`](../type-aliases/DeepReadonly.md)\<[`StateFromReducers`](../type-aliases/StateFromReducers.md)\<`RM`\>\>, [`EMFromReducersStrict`](../type-aliases/EMFromReducersStrict.md)\<`RM`\>\>[]

##### name

`string`

##### onCascade?

(`info`) => `void`

##### onEffectError?

(`error`, `event`) => `void`

##### onReducerError?

(`error`, `event`, `slice`) => `void`

##### onRejected?

(`rejection`, `event`, `slice`) => `void`

##### onSubscriberError?

(`error`, `event`, `phase`) => `void`

##### reducer

`RM`

##### scheduler?

[`Scheduler`](../interfaces/Scheduler.md)

### Returns

[`StoreInstance`](../interfaces/StoreInstance.md)\<keyof `RM` & `string`, [`StateFromReducers`](../type-aliases/StateFromReducers.md)\<`RM`\>, [`EMFromReducersStrict`](../type-aliases/EMFromReducersStrict.md)\<`RM`\>\>

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
