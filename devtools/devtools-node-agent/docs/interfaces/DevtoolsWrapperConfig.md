![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

[**@yoltra/devtools-node-agent**](../README.md)

***

[@yoltra/devtools-node-agent](../README.md) / DevtoolsWrapperConfig

# Interface: DevtoolsWrapperConfig

Defined in: [types.ts:29](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-node-agent/src/types.ts#L29)

Configuration for the Node.js DevTools store wrapper.

## Remarks

Passed to [withNodetools](../functions/withNodetools.md) to control how the store connects to the
DevTools hub. The only required field is [port](#port);
everything else has sensible defaults.

## Example

```ts
import { withNodetools } from '@yoltra/devtools-node-agent';

withNodetools(store, {
  port: 9800,
  host: 'localhost',
  allowReplay: true,
  throttleMs: 100,
});
```

## Properties

### allowEmit?

> `optional` **allowEmit**: `boolean`

Defined in: [types.ts:62](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-node-agent/src/types.ts#L62)

Allow DevTools extensions to emit events into this store.

#### Remarks

When `true`, the hub may send `EMIT_TO_STORE` commands which call
@yoltra/core#StoreInstance.emit \| store.emit() on behalf of a
connected extension.

#### Default Value

`false`

***

### allowReplay?

> `optional` **allowReplay**: `boolean`

Defined in: [types.ts:51](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-node-agent/src/types.ts#L51)

Enable event replay capability.

#### Remarks

Both the store and the DevTools hub must agree on replay support.
When `true`, the hub may send `EVENT_REPLAY` commands to this store.

#### Default Value

`false`

***

### authToken?

> `optional` **authToken**: `string`

Defined in: [types.ts:72](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-node-agent/src/types.ts#L72)

Shared secret required by a hub that was started with one.

#### Remarks

A hub running without a token accepts any local connection, so on a shared or containerised
host it should be started with one and every agent given the same value. Omit on a
developer machine, where the hub warns at startup that it is open.

***

### autoReconnect?

> `optional` **autoReconnect**: `boolean`

Defined in: [types.ts:129](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-node-agent/src/types.ts#L129)

Whether to automatically reconnect after an unexpected disconnect.

#### Default Value

`true`

***

### baseDelay?

> `optional` **baseDelay**: `number`

Defined in: [types.ts:133](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-node-agent/src/types.ts#L133)

Base delay (ms) for exponential backoff between reconnection attempts.

#### Default Value

`1000`

***

### host?

> `optional` **host**: `string`

Defined in: [types.ts:31](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-node-agent/src/types.ts#L31)

Hub server hostname or IP address.

#### Default Value

`"localhost"`

***

### maxDelay?

> `optional` **maxDelay**: `number`

Defined in: [types.ts:135](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-node-agent/src/types.ts#L135)

Maximum delay cap (ms) for exponential backoff.

#### Default Value

`30000`

***

### maxReconnectAttempts?

> `optional` **maxReconnectAttempts**: `number`

Defined in: [types.ts:131](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-node-agent/src/types.ts#L131)

Maximum number of reconnection attempts before giving up.

#### Default Value

`Infinity`

***

### maxSnapshotBytes?

> `optional` **maxSnapshotBytes**: `number`

Defined in: [types.ts:85](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-node-agent/src/types.ts#L85)

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

Defined in: [types.ts:33](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-node-agent/src/types.ts#L33)

Hub server port number. Required -- there is no default.

***

### sampling?

> `optional` **sampling**: `SamplingConfig`

Defined in: [types.ts:127](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-node-agent/src/types.ts#L127)

Sampling configuration defined by the DevTools protocol.

#### Remarks

Part of the protocol v1 design; actual enforcement is deferred.
See @yoltra/devtools-protocol#SamplingConfig for shape details.

***

### sanitize()?

> `optional` **sanitize**: (`path`, `value`) => `unknown`

Defined in: [types.ts:109](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-node-agent/src/types.ts#L109)

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
withNodetools(store, { port: 9800, sanitize });
```

Omitted, nothing is redacted — fine for a laptop loop, not fine for a service whose
state a hub on another machine can ask for.

***

### storeId?

> `optional` **storeId**: `string`

Defined in: [types.ts:41](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-node-agent/src/types.ts#L41)

Persisted store identifier that survives reconnects.

#### Remarks

If omitted a random UUID is generated via `crypto.randomUUID()`.
Providing a stable ID lets the hub correlate a store across restarts.

***

### throttleMs?

> `optional` **throttleMs**: `number`

Defined in: [types.ts:119](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-node-agent/src/types.ts#L119)

Throttle interval for DevTools updates (milliseconds).

#### Remarks

`0` disables throttling (every event is forwarded immediately).
A positive value batches updates within the given window.

#### Default Value

`0`
