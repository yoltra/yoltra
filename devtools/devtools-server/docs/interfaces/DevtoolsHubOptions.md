[**@yoltra/devtools-server**](../README.md)

***

[@yoltra/devtools-server](../README.md) / DevtoolsHubOptions

# Interface: DevtoolsHubOptions

Defined in: hub.ts:26

Configuration for the DevTools hub server.

## Remarks

All fields are optional; sensible defaults are applied when omitted.

## Properties

### historySize?

> `optional` **historySize**: `number`

Defined in: hub.ts:32

Maximum events retained in the ring buffer for late-connecting extensions.

#### Default

```ts
1000
```

***

### host?

> `optional` **host**: `string`

Defined in: hub.ts:30

Host to bind on.

#### Default

```ts
"127.0.0.1" (localhost only for v1 security)
```

***

### port?

> `optional` **port**: `number`

Defined in: hub.ts:28

Port to bind on.

#### Default

```ts
9800
```
