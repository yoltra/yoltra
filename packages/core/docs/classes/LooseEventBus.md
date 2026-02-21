[**@yoltra/core**](../README.md)

***

[@yoltra/core](../README.md) / LooseEventBus

# Class: LooseEventBus\<C, T, P\>

Defined in: [eventBus/LooseEventBus.ts:44](https://github.com/yoltra/yoltra/blob/7bf784f9e7daaf114608ff30306ac3400da926ed/packages/core/src/eventBus/LooseEventBus.ts#L44)

Flexible, synchronous pub/sub bus that supports **exact** and **pattern** event subscriptions.

## Remarks

- **Exact handlers** subscribe to a specific `(channel, type)` pair. Type keys are **normalized** by stripping a single leading dot (`".foo"` → `"foo"`).
- **Pattern handlers** subscribe using wildcards over dot-separated segments:
  - `*`   matches **one** segment.
  - `**`  matches **zero or more** segments (greedy).
- On [\`emit\`](#emit), exact handlers fire first, then any matching pattern handlers.
- Handlers are **de-duplicated**: if the same function is both exact and pattern-registered, it is called **once**.
- Handler invocation is **synchronous**. Exceptions are caught and logged; remaining handlers still run.

## Example

```ts
type C = 'ui' | 'data';
type T = string;
type P = unknown;

const bus = new LooseEventBus<C, T, P>();

// Exact
const offA = bus.on('ui', 'panel.open', () => console.log('panel opened'));

// Patterns
const offB = bus.on('ui', 'panel.*', () => console.log('any single sub-event under panel'));
const offC = bus.on('ui', 'panel.**', () => console.log('any depth under panel'));

bus.emit('ui', 'panel.open', null);
// => exact fires, then 'panel.*', then 'panel.**'

offA(); offB(); offC(); // unsubscribe
```

## Type Parameters

### C

`C` *extends* `string` = `string`

Channel name type (defaults to `string`).

### T

`T` *extends* `string` = `string`

Event type name type (defaults to `string`). Types are treated as **dot-separated paths** (e.g. `"a.b.c"`).

### P

`P` = `any`

Payload type for all events (defaults to `any`).

## Constructors

### Constructor

> **new LooseEventBus**\<`C`, `T`, `P`\>(): `LooseEventBus`\<`C`, `T`, `P`\>

#### Returns

`LooseEventBus`\<`C`, `T`, `P`\>

## Methods

### clear()

> **clear**(): `void`

Defined in: [eventBus/LooseEventBus.ts:364](https://github.com/yoltra/yoltra/blob/7bf784f9e7daaf114608ff30306ac3400da926ed/packages/core/src/eventBus/LooseEventBus.ts#L364)

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

Defined in: [eventBus/LooseEventBus.ts:209](https://github.com/yoltra/yoltra/blob/7bf784f9e7daaf114608ff30306ac3400da926ed/packages/core/src/eventBus/LooseEventBus.ts#L209)

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

### off()

> **off**(`channel`, `type`, `handler`): `void`

Defined in: [eventBus/LooseEventBus.ts:135](https://github.com/yoltra/yoltra/blob/7bf784f9e7daaf114608ff30306ac3400da926ed/packages/core/src/eventBus/LooseEventBus.ts#L135)

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

Defined in: [eventBus/LooseEventBus.ts:89](https://github.com/yoltra/yoltra/blob/7bf784f9e7daaf114608ff30306ac3400da926ed/packages/core/src/eventBus/LooseEventBus.ts#L89)

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
