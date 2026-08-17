![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

# @yoltra/devtools-browser-agent

> 👉 🇲🇽 Versión en Español&nbsp; | &nbsp;[ 🇺🇸 English Version](./README.md)&nbsp;

**Agente de DevTools para el navegador — conecta un store de Yoltra al hub de DevTools desde el
navegador.**

`@yoltra/devtools-browser-agent` instrumenta un store de Yoltra de forma transparente, así que
cada evento, cambio de estado y métrica se reenvía al hub de DevTools en tiempo real. Usa la API
nativa `WebSocket` del navegador (sin dependencia de `ws`), con reconexión automática y búfer de
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

1. **Registra un efecto `when: { any: true }`** en el store para interceptar cada evento
2. **Calcula diferencias en JSON Patch** entre el estado anterior y el siguiente
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

El envoltorio es **transparente**: devuelve la misma instancia del store.

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

## Comparación con `@yoltra/devtools-node-agent`

| Característica     | `devtools-browser-agent` | `devtools-node-agent`     |
| ------------------ | ------------------------ | ------------------------- |
| Entorno            | Navegador                | Node.js                   |
| WebSocket          | API nativa `WebSocket`   | Paquete `ws`              |
| Impacto en bundle  | Cero dependencias        | Añade `ws`                |
| Caso de uso        | SPAs, apps de navegador  | Servidores, CLIs, SSR     |

Ambos agentes ofrecen la misma instrumentación y el mismo cumplimiento del protocolo.

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
