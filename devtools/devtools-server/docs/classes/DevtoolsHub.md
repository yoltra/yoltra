[**@yoltra/devtools-server**](../README.md)

***

[@yoltra/devtools-server](../README.md) / DevtoolsHub

# Class: DevtoolsHub

Defined in: hub.ts:69

Central WebSocket hub that brokers messages between Yoltra stores and DevTools extensions.

## Remarks

- Accepts WS connections, validates protocol handshakes, and routes messages.
- Store events are fan-out to all extension clients.
- Extension commands are routed to the target store by `storeId`.
- Maintains a ring buffer of recent events for late-connecting extensions.
- Binds to localhost only (v1 security).

## Example

```ts
import { DevtoolsHub } from '@yoltra/devtools-server';

const hub = new DevtoolsHub({ port: 9800 });
await hub.start();
// ... later
await hub.stop();
```

## Constructors

### Constructor

> **new DevtoolsHub**(`opts`): `DevtoolsHub`

Defined in: hub.ts:83

Create a new DevTools hub instance.

#### Parameters

##### opts

[`DevtoolsHubOptions`](../interfaces/DevtoolsHubOptions.md) = `{}`

Hub configuration. All fields are optional.

#### Returns

`DevtoolsHub`

## Accessors

### extensionCount

#### Get Signature

> **get** **extensionCount**(): `number`

Defined in: hub.ts:379

Current number of connected extensions.

##### Returns

`number`

***

### historySize

#### Get Signature

> **get** **historySize**(): `number`

Defined in: hub.ts:388

Number of events in the history ring buffer.

##### Returns

`number`

***

### storeCount

#### Get Signature

> **get** **storeCount**(): `number`

Defined in: hub.ts:370

Current number of connected stores.

##### Returns

`number`

## Methods

### start()

> **start**(): `Promise`\<`void`\>

Defined in: hub.ts:98

Start the WebSocket server and begin accepting connections.

#### Returns

`Promise`\<`void`\>

Resolves once the server is bound and listening.

#### Throws

If the underlying `WebSocketServer` emits an error during
        startup (e.g. port already in use).

***

### stop()

> **stop**(): `Promise`\<`void`\>

Defined in: hub.ts:127

Stop the server and close all connections.

#### Returns

`Promise`\<`void`\>

Resolves once the server has fully shut down.

#### Remarks

Existing client sockets are closed with code `1001` ("Going Away")
before the server socket is torn down.

***

### probe()

> `static` **probe**(`port`): `Promise`\<`boolean`\>

Defined in: hub.ts:152

Check if a DevTools hub is already running on the given port.

#### Parameters

##### port

`number`

Port to probe.

#### Returns

`Promise`\<`boolean`\>

`true` if a hub is listening and responds to handshake.
