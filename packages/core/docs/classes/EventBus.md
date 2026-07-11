[**@yoltra/core**](../README.md)

***

[@yoltra/core](../README.md) / EventBus

# Class: EventBus\<EM\>

Defined in: [eventBus/EventBus.ts:48](https://github.com/yoltra/yoltra/blob/deb942c60b290a53939a9e286974c0da4e3f44ce/packages/core/src/eventBus/EventBus.ts#L48)

Minimal, synchronous pub/sub event bus keyed by **channel** and **type**.

## Remarks

- Handlers are stored per `(channel, type)` and invoked **synchronously** in subscription order.
- Exceptions thrown by a handler are **caught and logged**, and do **not** stop other handlers.
- Intended for in-memory, single-process usage (no cross-tab/process broadcasting).

## Example

```ts
type EM = {
  ui: { toggle: boolean };
  data: { loaded: { items: string[] } };
};

const bus = new EventBus<EM>();

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

### EM

`EM` *extends* [`EventMapBase`](../type-aliases/EventMapBase.md)

Event map shape:
```ts
type EventMapBase = Record<string, Record<string, unknown>>;
// Example:
type EM = {
  ui: { toggle: boolean };
  data: { loaded: { items: string[] } };
};
```

## Constructors

### Constructor

> **new EventBus**\<`EM`\>(): `EventBus`\<`EM`\>

#### Returns

`EventBus`\<`EM`\>

## Methods

### clear()

> **clear**(): `void`

Defined in: [eventBus/EventBus.ts:188](https://github.com/yoltra/yoltra/blob/deb942c60b290a53939a9e286974c0da4e3f44ce/packages/core/src/eventBus/EventBus.ts#L188)

Clears **all** listeners across all channels/types.

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

> **emit**\<`C`, `T`\>(`channel`, `type`, `payload`): `void`

Defined in: [eventBus/EventBus.ts:155](https://github.com/yoltra/yoltra/blob/deb942c60b290a53939a9e286974c0da4e3f44ce/packages/core/src/eventBus/EventBus.ts#L155)

Emits an event to all subscribers of the exact `(channel, type)`.

Handlers are invoked **synchronously**. Any exception thrown by a handler is
caught and logged, and other handlers still run.

#### Type Parameters

##### C

`C` *extends* `string`

Channel key (string key of `EM`).

##### T

`T` *extends* `string`

Type key within channel `C` (string key of `EM[C]`).

#### Parameters

##### channel

`C`

Channel name to emit on.

##### type

`T`

Event type to emit.

##### payload

`EM`\[`C`\]\[`T`\]

Payload matching `EM[C][T]`.

#### Returns

`void`

#### Example

```ts
bus.emit('ui', 'toggle', false);
```

***

### off()

> **off**\<`C`, `T`\>(`channel`, `type`, `handler`): `void`

Defined in: [eventBus/EventBus.ts:119](https://github.com/yoltra/yoltra/blob/deb942c60b290a53939a9e286974c0da4e3f44ce/packages/core/src/eventBus/EventBus.ts#L119)

Removes a specific handler previously added with [\`on\`](#on).

#### Type Parameters

##### C

`C` *extends* `string`

Channel key (string key of `EM`).

##### T

`T` *extends* `string`

Type key within channel `C` (string key of `EM[C]`).

#### Parameters

##### channel

`C`

Channel name of the subscription to remove.

##### type

`T`

Event type of the subscription to remove.

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

> **on**\<`C`, `T`\>(`channel`, `type`, `handler`): () => `void`

Defined in: [eventBus/EventBus.ts:77](https://github.com/yoltra/yoltra/blob/deb942c60b290a53939a9e286974c0da4e3f44ce/packages/core/src/eventBus/EventBus.ts#L77)

Subscribes a handler to an exact `(channel, type)`.

#### Type Parameters

##### C

`C` *extends* `string`

Channel key (must be a string key of `EM`).

##### T

`T` *extends* `string`

Type key within channel `C` (must be a string key of `EM[C]`).

#### Parameters

##### channel

`C`

Channel name to subscribe to.

##### type

`T`

Event type within the channel.

##### handler

(`payload`) => `void`

Function invoked with the payload type `EM[C][T]`.

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
