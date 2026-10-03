![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

# @yoltra/devtools-browser-agent

> 👉 🇲🇽 Versión en Español&nbsp; | &nbsp;[ 🇺🇸 English Version](./README.md)&nbsp;

[![versión npm](https://img.shields.io/npm/v/@yoltra/devtools-browser-agent)](https://www.npmjs.com/package/@yoltra/devtools-browser-agent)
[![descargas npm](https://img.shields.io/npm/dm/@yoltra/devtools-browser-agent)](https://www.npmjs.com/package/@yoltra/devtools-browser-agent)
[![tipos](https://img.shields.io/npm/types/@yoltra/devtools-browser-agent)](https://www.npmjs.com/package/@yoltra/devtools-browser-agent)
[![Licencia](https://img.shields.io/npm/l/@yoltra/devtools-browser-agent)](https://github.com/yoltra/yoltra/blob/main/LICENSE)

**Agente de DevTools para el navegador: conecta un store de Yoltra al hub de DevTools desde el
navegador.**

`@yoltra/devtools-browser-agent` instrumenta un store de Yoltra de forma transparente, así que
cada evento, cambio de estado y métrica se reenvía al hub de DevTools en tiempo real. Usa la API
nativa `WebSocket` del navegador (sin dependencias adicionales), con reconexión automática y
búfer de mensajes.

> **Documentación completa:** [@yoltra/devtools-browser-agent en yoltra.dev](https://yoltra.dev/es/yoltra/packages/devtools-browser-agent/)

## Instalación

```bash
npm install @yoltra/devtools-browser-agent
```

**Dependencia peer:** `@yoltra/core`

## Inicio rápido

```typescript
import { withDevtools } from "@yoltra/devtools-browser-agent";

// Instrumenta el store: se conecta al hub en ws://localhost:9800
withDevtools(store, { port: 9800 });

// Usa el store con normalidad: los eventos se reenvían automáticamente
await store.emit("todos", "add", { title: "Comprar leche" });
```

## Cómo funciona

El agente se engancha a la costura de instrumentación tipada del store,
`store.instrument(observer)`, convierte las rutas cambiadas de cada evento en parches RFC-6902 y
los envía como mensajes `STORE_EVENT`, con `reason` y `vetoedBy` para un evento no confirmado.
Guarda hasta 100 mensajes mientras está desconectado y responde a `REQUEST_STATE`,
`REQUEST_METRICS`, `REQUEST_SUBSCRIPTIONS`, `TIME_TRAVEL`, `EVENT_REPLAY` y `EMIT_TO_STORE`. Los
eventos de canales `ephemeral` no se reportan, y el envoltorio es **transparente**: devuelve la
misma instancia del store.

El transporte es un `socketFactory` propio, el puente `postMessage` de la extensión o un
`WebSocket` nativo. Los payloads se muestrean, se acotan con `maxEventBytes` y
`maxSnapshotBytes` y pasan por `sanitize`. El viaje en el tiempo tiene dos candados: el agente
necesita `allowReplay`, y el store debe crearse con `createStore({ devtools: { allowReplay: true } })`.

## Configuración

`withDevtools(store, config)` recibe un `DevtoolsWrapperConfig`: `port` (obligatorio), `host`
(`"localhost"`), `storeId` (`store.name`), `allowReplay` y `allowEmit` (ambos `false`),
`autoReconnect` (`true`), `maxReconnectAttempts`, `baseDelay` y `maxDelay`.

```typescript
withDevtools(store, {
  port: 9800,
  storeId: "my-app-store",
  allowReplay: true,
  allowEmit: true,
  autoReconnect: true,
  maxReconnectAttempts: 20,
  baseDelay: 1000,
  maxDelay: 15000,
});
```

El hub acepta una conexión por id de store: da `storeId` distintos a stores con el mismo `name`.

## Reconexión

Backoff exponencial con 10 % de jitter, desde `baseDelay` (1 s) hasta `maxDelay` (30 s). Los
mensajes se guardan en un búfer durante la desconexión y se vacían al reconectar.

## Referencia de la API

`withDevtools(store, config)` y el tipo `DevtoolsWrapperConfig`, en la
[referencia de la API](https://yoltra.dev/es/yoltra/api/devtools-browser-agent/). La página del
paquete diagrama [cómo funciona](https://yoltra.dev/es/yoltra/packages/devtools-browser-agent/#cómo-funciona).

```mermaid
flowchart TD
    accTitle: Cómo funciona el agente de navegador
    accDescr: withDevtools elige un transporte, reporta eventos instrumentados y métricas al hub o a la extensión, y responde comandos de estado, replay y emit cuando están permitidos
    app(["tu app: withDevtools(store, config)"])
    store(["el store de @yoltra/core"])

    subgraph agent ["withDevtools"]
    direction TB
        pick{"¿qué transporte?"}
        pick -->|"config.socketFactory"| custom["esa factory<br/>por ejemplo createLoopbackHub"]
        pick -->|"transport bridge, o auto con<br/>__YOLTRA_DEVTOOLS_BRIDGE__ presente"| pm["createPostMessageSocketFactory<br/>window.postMessage, yoltra-devtools-bridge"]
        pick -->|"transport websocket, o auto<br/>sin la marca"| native["WebSocket nativo<br/>ws://host:port"]
        custom --> client
        pm --> client
        native --> client["DevtoolsWsClient<br/>ReconnectingWsClient: handshake,<br/>búfer de 100, backoff"]

        obs["observador de instrument<br/>rutas cambiadas, valores anterior y siguiente,<br/>reduceTimeMs, sin canales ephemeral"]
        obs --> counters["contadores de métricas<br/>intentados, confirmados, tiempo de reducción"]
        counters --> sample{"¿descartado por muestreo?<br/>ignore, luego throttle, luego skip"}
        sample -->|"sí"| skipped(["no se envía, pero se cuenta"])
        sample -->|"no"| build["STORE_EVENT<br/>patchesFromChange, payload y valores de parches<br/>acotados por maxEventBytes, pasados por sanitize"]
        build -->|"un evento confirmado incrementa snapshotVersion"| client
        regs["onRegistrationChange<br/>se omite si todos los cambios son internos"] --> subs["STORE_SUBSCRIPTIONS<br/>desde __devtoolsIntrospect"]
        subs --> client

        client -->|"comando entrante"| cmd{"msg.type"}
        cmd -->|"REQUEST_STATE"| snap["encodeStateBounded<br/>maxSnapshotBytes, sanitize"]
        cmd -->|"REQUEST_METRICS"| met["__devtoolsIntrospect más contadores"]
        cmd -->|"REQUEST_SUBSCRIPTIONS"| subs
        cmd -->|"TIME_TRAVEL, si allowReplay"| tt["__applyExternalState(decodeState(state))<br/>y luego un STATE_SNAPSHOT nuevo"]
        cmd -->|"EVENT_REPLAY, si allowReplay"| rep["__replayEvents"]
        cmd -->|"EMIT_TO_STORE, si allowEmit"| emitCmd["store.emit"]
        snap -->|"STATE_SNAPSHOT"| client
        met -->|"STORE_METRICS"| client
        tt -->|"STATE_SNAPSHOT"| client
    end

    app --> pick
    store -->|"cada reducción"| obs
    store -->|"cambian los registros"| regs
    tt --> store
    rep --> store
    emitCmd --> store
    client <-->|"tramas del protocolo"| far(["un hub, el puente de la extensión<br/>o un broker loopback"])
```

## Paquetes relacionados

- **[@yoltra/devtools-protocol](../devtools-protocol/README.es.md)**: formato de cable y tipos de mensaje
- **[@yoltra/devtools-server](../devtools-server/README.es.md)**: el hub al que se conecta este agente
- **[@yoltra/devtools-ext](../devtools-ext/README.es.md)**: extensión de navegador que muestra la UI
- **[@yoltra/core](../../packages/core/README.es.md)**: el store que se instrumenta

## Licencia

**MIT**. De uso libre en proyectos comerciales y de código abierto.

> **Documentación completa:** [@yoltra/devtools-browser-agent en yoltra.dev](https://yoltra.dev/es/yoltra/packages/devtools-browser-agent/)
