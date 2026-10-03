![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

# @yoltra/devtools-ui

> 👉 🇲🇽 Versión en Español&nbsp; | &nbsp;[ 🇺🇸 English Version](./README.md)&nbsp;

[![versión npm](https://img.shields.io/npm/v/@yoltra/devtools-ui)](https://www.npmjs.com/package/@yoltra/devtools-ui)
[![descargas npm](https://img.shields.io/npm/dm/@yoltra/devtools-ui)](https://www.npmjs.com/package/@yoltra/devtools-ui)
[![tipos](https://img.shields.io/npm/types/@yoltra/devtools-ui)](https://www.npmjs.com/package/@yoltra/devtools-ui)
[![Licencia](https://img.shields.io/npm/l/@yoltra/devtools-ui)](https://github.com/yoltra/yoltra/blob/main/LICENSE)

**Hooks de React y lógica de negocio compartidos por las UIs de Yoltra DevTools.**

`@yoltra/devtools-ui` es una capa de lógica sin interfaz que ofrece hooks de React para conectarse
al hub de DevTools, seguir el estado de un store, explorar eventos y controlar el viaje en el
tiempo. **No contiene componentes de UI**: el renderizado corre a cargo de paquetes como
`@yoltra/devtools-storeview` (React DOM) y `@yoltra/devtools-cli` (Ink).

> **Documentación completa:** [@yoltra/devtools-ui en yoltra.dev](https://yoltra.dev/es/yoltra/packages/devtools-ui/)

## Instalación

```bash
npm install @yoltra/devtools-ui
```

**Dependencia peer:** `react` ^18

## Inicio rápido

Envuelve tu UI de DevTools en un `HubProvider` y usa los hooks:

```tsx
function App() {
  return (
    <HubProvider config={{ port: 9800, extensionName: "My Panel" }}>
      <Dashboard />
    </HubProvider>
  );
}
```

Dentro, `useHubConnection()` da el `status` de la conexión, `useStoreRegistry()` los stores
conectados, y `useEventLog(storeId)` y `useStoreState(storeId)` los eventos y el estado en vivo de
uno de ellos.

## Hooks

- **Conexión y registro:** `useHubConnection()` (`status`, `send`, `subscribe`, `disconnect`,
  `reconnect`) y `useStoreRegistry()`.
- **Datos:** `useEventLog`, `useStoreState`, `useStoreSubscriptions` y `useStoreMetrics`, cada uno
  con un `storeId`.
- **Acciones:** `useTimeTravel(storeId, entries)`, `useEventReplay(storeId)` y
  `useEventEmitter(storeId)`.

## Contexto

`HubProvider` envuelve a sus hijos en una sola conexión al hub. Su `HubConnectionConfig` recibe
`port`, `host` (`"localhost"`), `extensionName`, `autoReconnect` (`true`), `maxReconnectAttempts`
(`Infinity`) y `authToken`, el token del hub cuando se inició con uno.

## Cómo funciona

`HubProvider` es dueño del único socket y entrega a cada hook el mismo `send` y `subscribe` a
través de `HubContext`. Los hooks de datos filtran las tramas entrantes por `storeId`, y los de
acción solo envían comandos; nada se guarda en búfer del lado del panel. El hub puede ser uno real
o `createLoopbackHub()`, que habla el mismo protocolo dentro de la página. Ver el
[diagrama](https://yoltra.dev/es/yoltra/packages/devtools-ui/#cómo-funciona).

```mermaid
flowchart TD
    accTitle: Cómo se conecta devtools-ui
    accDescr: HubProvider hace el handshake con el hub y se reconecta con backoff, y cada hook se suscribe a los mensajes que necesita y envía los comandos que pide una vista
    hub(["un hub, o createLoopbackHub() en la misma página"])
    view(["una UI de React: storeview, la CLI o tu propio panel"])

    subgraph ui ["@yoltra/devtools-ui"]
    direction TB
        provider["HubProvider<br/>config.WebSocket o el WebSocket global"]
        provider -->|"onopen"| hs["HANDSHAKE_REQUEST<br/>role EXTENSION, todas las capacidades activas"]
        hs --> ok{"¿HANDSHAKE_RESPONSE con success?"}
        ok -->|"no"| closeIt["cierra el socket"]
        closeIt --> retry["reconecta con backoff<br/>750 ms duplicados más jitter, tope de 30 s"]
        retry --> provider
        ok -->|"sí"| ctx["HubContext<br/>status, send, subscribe"]

        ctx -->|"subscribe"| registry["useStoreRegistry<br/>STORE_REGISTRY, STORE_CONNECTED,<br/>STORE_DISCONNECTED"]
        ctx -->|"subscribe"| log["useEventLog<br/>STORE_EVENT por store, últimos 2000"]
        ctx -->|"subscribe y send"| stateHook["useStoreState<br/>REQUEST_STATE cada 1.5 s hasta una instantánea,<br/>luego applyPatches por cada STORE_EVENT confirmado"]
        ctx -->|"subscribe y send"| metricsHook["useStoreMetrics<br/>REQUEST_METRICS cada 2 s"]
        ctx -->|"subscribe y send"| subsHook["useStoreSubscriptions<br/>REQUEST_SUBSCRIPTIONS"]
        log -->|"entries"| travel["useTimeTravel<br/>replayState desde el primer STATE_SNAPSHOT"]
        travel -->|"TIME_TRAVEL"| ctx
        replayHook["useEventReplay"] -->|"EVENT_REPLAY"| ctx
        emitHook["useEventEmitter"] -->|"EMIT_TO_STORE"| ctx
    end

    hub <-->|"tramas del protocolo"| provider
    registry --> view
    log --> view
    stateHook --> view
    metricsHook --> view
    subsHook --> view
    travel --> view
    view -->|"acciones del usuario"| replayHook
    view -->|"acciones del usuario"| emitHook
```

## Sincronización del estado

`useStoreState` pide un `STATE_SNAPSHOT` completo al montarse, guarda en un búfer los parches
`STORE_EVENT` que lleguen antes, y luego aplica cada parche de forma incremental con
`applyPatches`, así que la UI refleja el estado más reciente sin pedir instantáneas completas.

## Viaje en el tiempo

`useTimeTravel` devuelve `currentIndex`, `isTimeTraveling`, `jumpTo`, `stepBack`, `stepForward` y
`resume`. El panel reconstruye él mismo el estado destino, aplicando parches hacia adelante desde
la primera instantánea que vio, y envía ese estado completo. Tanto el agente como el store se
niegan si el replay no está habilitado. La página del paquete tiene la
[secuencia de un salto](https://yoltra.dev/es/yoltra/packages/devtools-ui/#viaje-en-el-tiempo).

## Referencia de la API

`HubProvider`, `HubContext`, los hooks de arriba, `applyPatches(state, patches)`, y los tipos
`HubConnectionConfig`, `HubConnectionStatus`, `HubContextValue`, `RegisteredStore` y
`EventLogEntry`: ver la [referencia de la API](https://yoltra.dev/es/yoltra/api/devtools-ui/).

## Paquetes relacionados

- **[@yoltra/devtools-protocol](../devtools-protocol/README.es.md)**: formato de cable que consumen estos hooks
- **[@yoltra/devtools-storeview](../devtools-storeview/README.es.md)**: UI de React DOM construida sobre estos hooks
- **[@yoltra/devtools-server](../devtools-server/README.es.md)**: el hub al que se conectan estos hooks

## Licencia

**MIT**. De uso libre en proyectos comerciales y de código abierto.

> **Documentación completa:** [@yoltra/devtools-ui en yoltra.dev](https://yoltra.dev/es/yoltra/packages/devtools-ui/)
