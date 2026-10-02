![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

# @yoltra/devtools-browser-agent

> 👉 🇲🇽 Versión en Español&nbsp; | &nbsp;[ 🇺🇸 English Version](./README.md)&nbsp;

[![versión npm](https://img.shields.io/npm/v/@yoltra/devtools-browser-agent)](https://www.npmjs.com/package/@yoltra/devtools-browser-agent)
[![descargas npm](https://img.shields.io/npm/dm/@yoltra/devtools-browser-agent)](https://www.npmjs.com/package/@yoltra/devtools-browser-agent)
[![tipos](https://img.shields.io/npm/types/@yoltra/devtools-browser-agent)](https://www.npmjs.com/package/@yoltra/devtools-browser-agent)
[![Licencia](https://img.shields.io/npm/l/@yoltra/devtools-browser-agent)](https://github.com/yoltra/yoltra/blob/main/LICENSE)

**Agente de DevTools para el navegador — conecta un store de Yoltra al hub de DevTools desde el
navegador.**

`@yoltra/devtools-browser-agent` instrumenta un store de Yoltra de forma transparente, así que
cada evento, cambio de estado y métrica se reenvía al hub de DevTools en tiempo real. Usa la API
nativa `WebSocket` del navegador (sin dependencias adicionales), con reconexión automática y búfer de
mensajes.

---

## Instalación

```bash
npm install @yoltra/devtools-browser-agent
```

**Dependencia peer:** `@yoltra/core`

---

## Inicio rápido

```typescript
import { createStore } from "@yoltra/core";
import { withDevtools } from "@yoltra/devtools-browser-agent";

const store = createStore({
  name: "TodoApp",
  reducer: {
    todos: {
      state: { items: [] },
      when: { channel: "todos" },
      reducer: (state, event) => {
        if (event.type === "add") return { items: [...state.items, event.payload] };
        return state;
      },
    },
  },
});

// Instrumenta el store — se conecta al hub en ws://localhost:9800
withDevtools(store, { port: 9800 });

// Usa el store con normalidad — los eventos se reenvían automáticamente
await store.emit("todos", "add", { title: "Comprar leche" });
```

---

## Cómo funciona

1. **Se engancha a la costura tipada de instrumentación**, `store.instrument(observer)`. El store
   reporta cada evento con sus rutas hoja cambiadas exactas, los valores anterior y siguiente, el
   estado de confirmación y los tiempos de reducción, y para un evento que no se confirmó, `reason`
   y `vetoedBy`. No hay efecto interceptor ni diferenciación de estado, y la costura no cuesta nada
   mientras no hay ningún observador adjunto.
2. **Traduce las rutas reportadas a parches RFC-6902** con `patchesFromChange`, y reenvía `reason`
   y `vetoedBy` en `STORE_EVENT` para que el panel pueda decir por qué un evento no se confirmó
3. **Envía mensajes `STORE_EVENT`** con los parches al hub
4. **Almacena mensajes en un búfer** (hasta 100) mientras está desconectado, y los vacía al
   reconectar
5. **Atiende los comandos entrantes** de las extensiones:
   - `REQUEST_STATE` → instantánea completa del estado
   - `REQUEST_METRICS` → contadores de rendimiento
   - `REQUEST_SUBSCRIPTIONS` → inventario de reducers y efectos
   - `TIME_TRAVEL` → restaura el store a un estado anterior
   - `EVENT_REPLAY` → reproduce eventos pasando solo por los reducers
   - `EMIT_TO_STORE` → inyecta un evento sintético

Los eventos de los canales `ephemeral` del store no se reportan: el agente registra su observador
sin `{ ephemeral: true }`, así que ese tráfico nunca llega a la línea de tiempo y no le cuesta nada.

El envoltorio es **transparente**: devuelve la misma instancia del store.

El diagrama muestra las dos direcciones dentro de `withDevtools`. De salida, cada evento observado
se convierte en un `STORE_EVENT`, muestreado y acotado en tamaño antes de enviarse. De entrada, un
comando toca el store solo si la capacidad correspondiente está activa: `allowReplay` para
`TIME_TRAVEL` y `EVENT_REPLAY`, `allowEmit` para `EMIT_TO_STORE`. El transporte se elige una sola
vez, al envolver el store.

```mermaid
flowchart TD
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

El viaje en el tiempo tiene dos candados: el agente ignora `TIME_TRAVEL` sin `allowReplay`, y el
propio store lanza un error desde `__applyExternalState` salvo que se haya creado con
`createStore({ devtools: { allowReplay: true } })`.

---

## Configuración

```typescript
interface DevtoolsWrapperConfig {
  /** Puerto del servidor hub. Requerido. */
  port: number;
  /** Host del servidor hub. @default "localhost" */
  host?: string;
  /** ID del store con el que lo identifican el hub y los paneles (sobrevive a las reconexiones). @default store.name */
  storeId?: string;
  /** Habilita el viaje en el tiempo y la reproducción de eventos. @default false */
  allowReplay?: boolean;
  /** Permite que las extensiones emitan eventos a este store. @default false */
  allowEmit?: boolean;
  /** Reconexión automática al desconectarse. @default true */
  autoReconnect?: boolean;
  /** Máximo de intentos de reconexión. @default Infinity */
  maxReconnectAttempts?: number;
  /** Retardo base para el backoff exponencial (ms). @default 1000 */
  baseDelay?: number;
  /** Tope máximo de retardo para el backoff (ms). @default 30000 */
  maxDelay?: number;
}
```

### Configuración completa

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

---

## Reconexión

El agente usa backoff exponencial con jitter para reconectarse:

- Empieza en `baseDelay` (1 s por defecto)
- Se duplica en cada intento, con tope en `maxDelay` (30 s por defecto)
- Añade un 10 % de jitter para evitar la estampida de reconexiones
- Los mensajes se guardan en un búfer durante las desconexiones y se vacían al reconectar

---

## Referencia de la API

| Export                        | Descripción                                    |
| ----------------------------- | ---------------------------------------------- |
| `withDevtools(store, config)` | Instrumenta un store y lo conecta al hub       |
| `DevtoolsWrapperConfig`       | Tipo de configuración                          |

---

## Paquetes relacionados

- **[@yoltra/devtools-protocol](../devtools-protocol/README.md)** — Formato de cable y tipos de
  mensaje
- **[@yoltra/devtools-server](../devtools-server/README.md)** — El hub al que se conecta este
  agente
- **[@yoltra/devtools-ext](../devtools-ext/README.md)** — Extensión de navegador que muestra la UI
- **[@yoltra/core](../../packages/core/README.md)** — El store que se instrumenta

---

## Licencia

**MIT** — De uso libre en proyectos comerciales y de código abierto.
