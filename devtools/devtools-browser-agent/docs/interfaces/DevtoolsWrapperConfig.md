![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

[**@yoltra/devtools-browser-agent**](../README.md)

***

[@yoltra/devtools-browser-agent](../README.md) / DevtoolsWrapperConfig

# Interface: DevtoolsWrapperConfig

Defined in: [types.ts:29](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-browser-agent/src/types.ts#L29)

Configuration for the browser DevTools store wrapper ([withDevtools](../functions/withDevtools.md)).

## Remarks

Controls how the browser agent connects to the DevTools hub, which
capabilities it advertises (replay, emit), and reconnection behaviour.
All fields except [port](#port) are optional and have sensible defaults.

## Example

```ts
const config: DevtoolsWrapperConfig = {
  port: 9800,
  host: 'localhost',
  allowReplay: true,
  autoReconnect: true,
};
```

## Properties

### allowEmit?

> `optional` **allowEmit**: `boolean`

Defined in: [types.ts:70](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-browser-agent/src/types.ts#L70)

Allow DevTools extensions to emit events to this store.

#### Remarks

When `true`, the hub may send `EMIT_TO_STORE` commands containing
arbitrary events that will be dispatched via `store.emit()`.

#### Default Value

`false`

***

### allowReplay?

> `optional` **allowReplay**: `boolean`

Defined in: [types.ts:59](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-browser-agent/src/types.ts#L59)

Enable event replay capability.

#### Remarks

When `true`, the hub may send `EVENT_REPLAY` commands to this store.
The store must also support replay internally.

#### Default Value

`false`

***

### authToken?

> `optional` **authToken**: `string`

Defined in: [types.ts:80](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-browser-agent/src/types.ts#L80)

Shared secret required by a hub that was started with one.

#### Remarks

A hub running without a token accepts any local connection, so on a shared or containerised
host it should be started with one and every agent given the same value. Omit on a
developer machine, where the hub warns at startup that it is open.

***

### autoReconnect?

> `optional` **autoReconnect**: `boolean`

Defined in: [types.ts:138](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-browser-agent/src/types.ts#L138)

Automatically reconnect to the hub on disconnect.

#### Default Value

`true`

***

### baseDelay?

> `optional` **baseDelay**: `number`

Defined in: [types.ts:150](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-browser-agent/src/types.ts#L150)

Base delay for exponential reconnection backoff (ms).

#### Default Value

`1000`

***

### host?

> `optional` **host**: `string`

Defined in: [types.ts:34](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-browser-agent/src/types.ts#L34)

Hub server host.

#### Default Value

`"localhost"`

***

### maxDelay?

> `optional` **maxDelay**: `number`

Defined in: [types.ts:156](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-browser-agent/src/types.ts#L156)

Maximum delay cap for reconnection backoff (ms).

#### Default Value

`30000`

***

### maxReconnectAttempts?

> `optional` **maxReconnectAttempts**: `number`

Defined in: [types.ts:144](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-browser-agent/src/types.ts#L144)

Maximum number of reconnection attempts before giving up.

#### Default Value

`Infinity`

***

### maxSnapshotBytes?

> `optional` **maxSnapshotBytes**: `number`

Defined in: [types.ts:93](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-browser-agent/src/types.ts#L93)

Byte budget for a state snapshot before parts of it are omitted.

#### Remarks

The hub refuses a frame over its cap and drops the connection, so an oversized snapshot did
not surface as an error — the socket closed, the client reconnected and asked again, and the
panel waited through the loop. Snapshots are bounded here instead, and a shortened one says
so rather than presenting a partial tree as the state.

#### Default Value

```ts
6291456 (6 MiB, under the hub's 8 MiB frame cap)
```

***

### port

> **port**: `number`

Defined in: [types.ts:39](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-browser-agent/src/types.ts#L39)

Hub server port. Required.

***

### sampling?

> `optional` **sampling**: `SamplingConfig`

Defined in: [types.ts:132](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-browser-agent/src/types.ts#L132)

Sampling configuration (protocol v1 design, implementation deferred).

#### Remarks

When provided, advertised to the hub as part of the store's capabilities.

***

### sanitize()?

> `optional` **sanitize**: (`path`, `value`) => `unknown`

Defined in: [types.ts:118](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-browser-agent/src/types.ts#L118)

Redacts a value before it leaves the process.

#### Parameters

##### path

`string`

##### value

`unknown`

#### Returns

`unknown`

#### Remarks

Store state and event payloads frequently hold tokens, session material and personal
data, and everything the agent forwards crosses a socket to another process. The hook is
applied to **every value the agent encodes** — state snapshots, time-travel snapshots,
event payloads and state patches — so nothing crosses unredacted. Return the replacement
value, or the value itself to keep it.

The `path` is the location within the structure being encoded (for a snapshot, from the
state root; for a payload, from the payload root), so a recipe that matches key names
covers all of them:

```ts
const sanitize = (path: string, value: unknown) =>
  /token|secret|password|authorization/i.test(path) ? "[redacted]" : value;
withDevtools(store, { port: 9800, sanitize });
```

Omitted, nothing is redacted — fine for a laptop loop, not fine for an embedded panel in
production or on a shared machine.

***

### socketFactory?

> `optional` **socketFactory**: `DevtoolsSocketFactory`

Defined in: [types.ts:165](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-browser-agent/src/types.ts#L165)

Custom socket factory (advanced). By default the agent opens a native
browser `WebSocket`. Inject a different transport — e.g. an in-memory
loopback for an embedded panel or a test — to connect the agent without a
real network socket.

#### Default Value

```ts
the native browser WebSocket factory
```

***

### storeId?

> `optional` **storeId**: `string`

Defined in: [types.ts:48](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-browser-agent/src/types.ts#L48)

Persisted store identifier that survives reconnects.

#### Remarks

When omitted a random UUID is generated via `crypto.randomUUID()`.
Provide an explicit value to correlate store sessions across page reloads.

***

### throttleMs?

> `optional` **throttleMs**: `number`

Defined in: [types.ts:124](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-browser-agent/src/types.ts#L124)

Throttle interval for DevTools updates (ms). `0` disables throttling.

#### Default Value

`0`

***

### transport?

> `optional` **transport**: `"auto"` \| `"bridge"` \| `"websocket"`

Defined in: [types.ts:181](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-browser-agent/src/types.ts#L181)

How the agent reaches the panel.

#### Remarks

- `"auto"` (the default) uses the `postMessage` bridge when an extension has announced
  itself on the page, and a WebSocket to the hub otherwise. This is what makes attaching a
  browser panel a single step — install the extension — instead of three.
- `"bridge"` forces `postMessage`, for a relay that installs after the store is created.
- `"websocket"` forces the hub, which is what a Node process or a remote session needs.

Ignored when `socketFactory` is supplied: an explicit transport is always honoured.

#### Default Value

`"auto"`
