![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

[**@yoltra/devtools-server**](../README.md)

***

[@yoltra/devtools-server](../README.md) / DevtoolsHubOptions

# Interface: DevtoolsHubOptions

Defined in: [hub.ts:26](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-server/src/hub.ts#L26)

Configuration for the DevTools hub server.

## Remarks

All fields are optional; sensible defaults are applied when omitted.

## Properties

### allowedExtensionIds?

> `optional` **allowedExtensionIds**: `string`[]

Defined in: [hub.ts:68](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-server/src/hub.ts#L68)

Extension ids allowed to connect, e.g. `["abcdefghijklmnopabcdefghijklmnop"]`.

#### Remarks

Extension origins all share one scheme, so permitting the scheme permits every extension the
user has installed — any of which could open this socket from a devtools page of its own.
Naming ids narrows that to the panel meant to connect.

Empty by default, which keeps every extension origin allowed: an unpacked build and a store
install have different ids, so assuming one would lock out a developer running the extension
they just built. Set it alongside [DevtoolsHubOptions.authToken](#authtoken) on any machine where
other extensions are not automatically trusted.

***

### allowedOrigins?

> `optional` **allowedOrigins**: `string`[]

Defined in: [hub.ts:39](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-server/src/hub.ts#L39)

Extra WebSocket `Origin` values to accept, beyond the always-allowed set
(no Origin, browser-extension origins, and loopback origins). Use this only
for a non-loopback local dev host (e.g. a custom `.local` domain). Adding a
remote origin re-opens the cross-site hijack surface — don't.

***

### authToken?

> `optional` **authToken**: `string`

Defined in: [hub.ts:54](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-server/src/hub.ts#L54)

Shared secret every client must present in its handshake.

#### Remarks

The hub binds to loopback, which keeps the network out — but loopback is not an
authentication boundary. Every other process on the machine can reach it, so without a token
anything running locally can connect as a panel and read the application's entire state,
inject events, and overwrite state through time-travel. That includes a package's install
script, and anything else sharing a CI runner or a container.

Unset by default, because requiring one would break the zero-configuration local flow that
makes the tool worth using. When unset the hub says so once at startup rather than leaving
the exposure unmentioned.

***

### historySize?

> `optional` **historySize**: `number`

Defined in: [hub.ts:32](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-server/src/hub.ts#L32)

Maximum events retained in the ring buffer for late-connecting extensions.

#### Default

```ts
1000
```

***

### host?

> `optional` **host**: `string`

Defined in: [hub.ts:30](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-server/src/hub.ts#L30)

Host to bind on.

#### Default

```ts
"127.0.0.1" (localhost only for v1 security)
```

***

### maxMessagesPerSecond?

> `optional` **maxMessagesPerSecond**: `number`

Defined in: [hub.ts:80](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-server/src/hub.ts#L80)

Most messages one client may send per second before the excess is dropped.

#### Remarks

A command like `REQUEST_STATE` costs the *store* a full serialization of its state and the
hub a fan-out, so a client that loops on it turns one cheap socket write into repeated work
across every connected process. This bounds that without affecting a panel behaving
normally, which sends a handful of commands per interaction.

#### Default Value

```ts
200
```

***

### port?

> `optional` **port**: `number`

Defined in: [hub.ts:28](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-server/src/hub.ts#L28)

Port to bind on.

#### Default

```ts
9800
```
