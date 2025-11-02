[**@quojs/core**](../README.md)

***

[@quojs/core](../README.md) / EventBus

# Class: EventBus\<AM\>

Defined in: [eventBus/EventBus.ts:48](https://github.com/quojs/quojs/blob/67acf22c99f7bb5bc1300e174ce891cc1abf66aa/packages/core/src/eventBus/EventBus.ts#L48)

Minimal, synchronous pub/sub event bus keyed by **channel** and **event**.

## Remarks

- Handlers are stored per `(channel, event)` and invoked **synchronously** in subscription order.
- Exceptions thrown by a handler are **caught and logged**, and do **not** stop other handlers.
- Intended for in-memory, single-process usage (no cross-tab/process broadcasting).

## Example

```ts
type AM = {
  ui: { toggle: boolean };
  data: { loaded: { items: string[] } };
};

const bus = new EventBus<AM>();

// Subscribe
const off = bus.on('ui', 'toggle', (on) => {
  console.log('UI toggled:', on);
});

// Emit
bus.emit('ui', 'toggle', true); // logs: "UI toggled: true"

// Unsubscribe
off();
```

## Type Parameters

### AM

`AM` *extends* [`ActionMapBase`](../type-aliases/ActionMapBase.md)

Action map shape:
```ts
type ActionMapBase = Record<string, Record<string, unknown>>;
// Example:
type AM = {
  ui: { toggle: boolean };
  data: { loaded: { items: string[] } };
};
```

## Constructors

### Constructor

> **new EventBus**\<`AM`\>(): `EventBus`\<`AM`\>

#### Returns

`EventBus`\<`AM`\>

## Methods

### clear()

> **clear**(): `void`

Defined in: [eventBus/EventBus.ts:188](https://github.com/quojs/quojs/blob/67acf22c99f7bb5bc1300e174ce891cc1abf66aa/packages/core/src/eventBus/EventBus.ts#L188)

Clears **all** listeners across all channels/events.

Useful for tests or during HMR teardown to avoid duplicate handlers.

#### Returns

`void`

#### Example

```ts
// In a test teardown:
afterEach(() => bus.clear());
```

***

### emit()

> **emit**\<`C`, `E`\>(`channel`, `event`, `payload`): `void`

Defined in: [eventBus/EventBus.ts:155](https://github.com/quojs/quojs/blob/67acf22c99f7bb5bc1300e174ce891cc1abf66aa/packages/core/src/eventBus/EventBus.ts#L155)

Emits an event to all subscribers of the exact `(channel, event)`.

Handlers are invoked **synchronously**. Any exception thrown by a handler is
caught and logged, and other handlers still run.

#### Type Parameters

##### C

`C` *extends* `string`

Channel key (string key of `AM`).

##### E

`E` *extends* `string`

Event key within channel `C` (string key of `AM[C]`).

#### Parameters

##### channel

`C`

Channel name to emit on.

##### event

`E`

Event name to emit.

##### payload

`AM`\[`C`\]\[`E`\]

Payload matching `AM[C][E]`.

#### Returns

`void`

#### Example

```ts
bus.emit('ui', 'toggle', false);
```

***

### off()

> **off**\<`C`, `E`\>(`channel`, `event`, `handler`): `void`

Defined in: [eventBus/EventBus.ts:119](https://github.com/quojs/quojs/blob/67acf22c99f7bb5bc1300e174ce891cc1abf66aa/packages/core/src/eventBus/EventBus.ts#L119)

Removes a specific handler previously added with [\`on\`](#on).

#### Type Parameters

##### C

`C` *extends* `string`

Channel key (string key of `AM`).

##### E

`E` *extends* `string`

Event key within channel `C` (string key of `AM[C]`).

#### Parameters

##### channel

`C`

Channel name of the subscription to remove.

##### event

`E`

Event name of the subscription to remove.

##### handler

(`payload`) => `void`

The same handler reference that was passed to `on`.

#### Returns

`void`

#### Example

```ts
const h = (n: number) => console.log('inc', n);
bus.on('math', 'inc', h);

// Explicitly remove this handler:
bus.off('math', 'inc', h);
```

***

### on()

> **on**\<`C`, `E`\>(`channel`, `event`, `handler`): () => `void`

Defined in: [eventBus/EventBus.ts:77](https://github.com/quojs/quojs/blob/67acf22c99f7bb5bc1300e174ce891cc1abf66aa/packages/core/src/eventBus/EventBus.ts#L77)

Subscribes a handler to an exact `(channel, event)`.

#### Type Parameters

##### C

`C` *extends* `string`

Channel key (must be a string key of `AM`).

##### E

`E` *extends* `string`

Event key within channel `C` (must be a string key of `AM[C]`).

#### Parameters

##### channel

`C`

Channel name to subscribe to.

##### event

`E`

Event name within the channel.

##### handler

(`payload`) => `void`

Function invoked with the payload type `AM[C][E]`.

#### Returns

An **unsubscribe** function that removes this handler.

> (): `void`

##### Returns

`void`

#### Example

```ts
const off = bus.on('data', 'loaded', ({ items }) => {
  console.log('Loaded', items.length, 'items');
});

// Later, stop listening:
off();
```
