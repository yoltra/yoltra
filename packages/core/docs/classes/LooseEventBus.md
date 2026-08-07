[**@yoltra/core**](../README.md)

***

[@yoltra/core](../README.md) / LooseEventBus

# Class: LooseEventBus\<C, T, P\>

Defined in: [eventBus/LooseEventBus.ts:64](https://github.com/yoltra/yoltra/blob/main/packages/core/src/eventBus/LooseEventBus.ts#L64)

## Type Parameters

### C

`C` *extends* `string` = `string`

### T

`T` *extends* `string` = `string`

### P

`P` = `any`

## Constructors

### Constructor

> **new LooseEventBus**\<`C`, `T`, `P`\>(): `LooseEventBus`\<`C`, `T`, `P`\>

#### Returns

`LooseEventBus`\<`C`, `T`, `P`\>

## Methods

### clear()

> **clear**(): `void`

Defined in: [eventBus/LooseEventBus.ts:523](https://github.com/yoltra/yoltra/blob/main/packages/core/src/eventBus/LooseEventBus.ts#L523)

Removes **all** listeners (exact and pattern). Useful for tests/HMR teardown.

#### Returns

`void`

#### Example

```ts
afterEach(() => bus.clear());
```

***

### emit()

> **emit**(`channel`, `type`, `payload`): `void`

Defined in: [eventBus/LooseEventBus.ts:259](https://github.com/yoltra/yoltra/blob/main/packages/core/src/eventBus/LooseEventBus.ts#L259)

Emits an event to all exact subscribers first, then to **matching pattern** subscribers.
Duplicate handler references are called **once** (de-duped).

#### Parameters

##### channel

`C`

Channel to emit on.

##### type

`T`

Event type (subject). A leading dot is ignored for matching.

##### payload

`P`

Payload delivered to handlers.

#### Returns

`void`

#### Example

```ts
// Suppose:
//  - on('ui', 'panel.open', h)
//  - on('ui', 'panel.*', h)       // same handler ref!
//  - on('ui', 'panel.**', other)
bus.emit('ui', 'panel.open', { id: 1 });
// => 'h' runs once (de-duped), then 'other'
```

***

### emitWith()

> **emitWith**(`channel`, `type`, `make`): `void`

Defined in: [eventBus/LooseEventBus.ts:305](https://github.com/yoltra/yoltra/blob/main/packages/core/src/eventBus/LooseEventBus.ts#L305)

Emits a payload that is only built if somebody is listening.

#### Parameters

##### channel

`C`

Channel to emit on.

##### type

`T`

Concrete event type.

##### make

() => `P`

Builds the payload. Called at most once, and only when a handler matched.

#### Returns

`void`

#### Remarks

Same matching as [LooseEventBus.emit](#emit); the difference is *when* the payload exists.
The store's change notification carries the old and new value at a path, and reading those
means walking the state tree twice per path. Doing that eagerly meant a slice nobody had
subscribed to paid the full cost of describing changes to an audience of nobody — the
matching work was already being done to discover there were no handlers.

***

### off()

> **off**(`channel`, `type`, `handler`): `void`

Defined in: [eventBus/LooseEventBus.ts:179](https://github.com/yoltra/yoltra/blob/main/packages/core/src/eventBus/LooseEventBus.ts#L179)

Unsubscribes an **exact** handler. The `type` key is normalized internally,
so callers can pass `"foo"` or `".foo"` interchangeably.

#### Parameters

##### channel

`C`

Channel name.

##### type

`T`

Exact event type key to remove (normalization applied).

##### handler

(`payload`) => `void`

The same handler reference previously passed to [\`on\`](#on).

#### Returns

`void`

#### Example

```ts
const h = () => {};
bus.on('ui', 'panel.open', h);
// Remove it (with or without leading dot)
bus.off('ui', '.panel.open', h);
```

***

### on()

> **on**(`channel`, `type`, `handler`): () => `void`

Defined in: [eventBus/LooseEventBus.ts:128](https://github.com/yoltra/yoltra/blob/main/packages/core/src/eventBus/LooseEventBus.ts#L128)

Subscribes a handler to either an **exact** type or a **pattern**.

#### Parameters

##### channel

`C`

Channel to subscribe on.

##### type

`T`

Exact event type (e.g. `"a.b"`) or pattern (contains `*`/`**`).

##### handler

(`payload`) => `void`

Function invoked with the emitted payload.

#### Returns

An **unsubscribe** function that removes this handler.

> (): `void`

##### Returns

`void`

#### Remarks

- Exact subscriptions are stored under a **normalized** key (leading `.` removed).
- Pattern subscriptions are stored **as provided**; matching normalizes the subject.

#### Examples

```ts
const off = bus.on('data', 'items.loaded', ({ count }) => {
  console.log('Loaded', count);
});
// Later
off();
```

```ts
// Match any single sub-event: 'panel.open', 'panel.close', etc.
const offStar = bus.on('ui', 'panel.*', () => {});

// Match any depth: 'panel.open', 'panel.items.add', 'panel', etc.
const offGlob = bus.on('ui', 'panel.**', () => {});
```
