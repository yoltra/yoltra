![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

# @yoltra/devtools-node-agent

> 👉 🇲🇽 Versión en Español&nbsp; | &nbsp;[ 🇺🇸 English Version](./README.md)&nbsp;

**Agente de DevTools para Node.js — conecta un store de Yoltra al hub de DevTools desde un proceso
de Node.js.**

`@yoltra/devtools-node-agent` instrumenta un store de Yoltra de forma transparente, así que cada
evento, cambio de estado y métrica se reenvía al hub de DevTools en tiempo real. Usa el paquete
`ws` para la conectividad WebSocket, con reconexión automática.

---

## Instalación

```bash
npm install @yoltra/devtools-node-agent
```

**Dependencia peer:** `@yoltra/core`

---

## Inicio rápido

```typescript
import { createStore } from "@yoltra/core";
import { withNodetools } from "@yoltra/devtools-node-agent";

const store = createStore({
  name: "MyServer",
  reducer: {
    counter: {
      state: { value: 0 },
      when: { any: true },
      reducer: (state, event) =>
        event.type === "increment" ? { value: state.value + 1 } : state,
    },
  },
});

// Instrumenta el store — se conecta al hub en ws://localhost:9800
withNodetools(store, { port: 9800 });

// Usa el store con normalidad — los eventos se reenvían automáticamente
await store.emit("counter", "increment", null);
```

---

## Cómo funciona

1. **Se engancha a la costura tipada de instrumentación** — `store.instrument(observer)`. El store
   reporta cada evento con sus **rutas hoja cambiadas** exactas, los valores anterior y siguiente,
   el estado de confirmación y los tiempos de reducción. Sin efecto interceptor, sin volver a
   diferenciar, sin clonar el estado completo — cuando no hay ningún observador adjunto, la
   costura no cuesta nada.
2. **Traduce las rutas reportadas a parches RFC-6902** con `patchesFromChange` (sin diferenciar
   estado)
3. **Envía mensajes `STORE_EVENT`** con los parches al hub
4. **Atiende los comandos entrantes** de las extensiones:
   - `REQUEST_STATE` → responde con un `STATE_SNAPSHOT` completo
   - `REQUEST_METRICS` → responde con `STORE_METRICS`
   - `REQUEST_SUBSCRIPTIONS` → responde con el inventario de reducers y efectos
   - `TIME_TRAVEL` → llama a `__applyExternalState()` en el store
   - `EVENT_REPLAY` → llama a `__replayEvents()` en el store
   - `EMIT_TO_STORE` → llama a `store.emit()` con el evento recibido

El envoltorio es **transparente**: devuelve la misma instancia del store. No hace falta cambiar
ninguna API.

---

## Configuración

```typescript
interface DevtoolsWrapperConfig {
  /** Puerto del servidor hub. Requerido. */
  port: number;
  /** Host del servidor hub. @default "localhost" */
  host?: string;
  /** ID persistente del store (sobrevive a las reconexiones). @default crypto.randomUUID() */
  storeId?: string;
  /** Habilita el viaje en el tiempo y la reproducción de eventos. @default false */
  allowReplay?: boolean;
  /** Permite que las extensiones emitan eventos a este store. @default false */
  allowEmit?: boolean;
  /** Configuración de muestreo (diseño v1, implementación diferida). */
  sampling?: SamplingConfig;
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

### Habilitar el viaje en el tiempo

```typescript
withNodetools(store, {
  port: 9800,
  allowReplay: true,
  allowEmit: true,
});
```

Cuando `allowReplay` es `true`, el store anuncia la capacidad `replay` y responde a los comandos
`TIME_TRAVEL` y `EVENT_REPLAY` de las extensiones.

---

## Referencia de la API

| Export                         | Descripción                              |
| ------------------------------ | ---------------------------------------- |
| `withNodetools(store, config)` | Instrumenta un store y lo conecta al hub |
| `DevtoolsWrapperConfig`        | Tipo de configuración                    |

---

## Paquetes relacionados

- **[@yoltra/devtools-protocol](../devtools-protocol/README.md)** — Formato de cable y tipos de
  mensaje
- **[@yoltra/devtools-server](../devtools-server/README.md)** — El hub al que se conecta este
  agente
- **[@yoltra/devtools-browser-agent](../devtools-browser-agent/README.md)** — Equivalente de este
  paquete para el navegador
- **[@yoltra/core](../../packages/core/README.md)** — El store que se instrumenta

---

## Licencia

**MIT** — De uso libre en proyectos comerciales y de código abierto.
