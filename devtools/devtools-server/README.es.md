![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

# @yoltra/devtools-server

> 👉 🇲🇽 Versión en Español&nbsp; | &nbsp;[ 🇺🇸 English Version](./README.md)&nbsp;

[![versión npm](https://img.shields.io/npm/v/@yoltra/devtools-server)](https://www.npmjs.com/package/@yoltra/devtools-server)
[![descargas npm](https://img.shields.io/npm/dm/@yoltra/devtools-server)](https://www.npmjs.com/package/@yoltra/devtools-server)
[![tipos](https://img.shields.io/npm/types/@yoltra/devtools-server)](https://www.npmjs.com/package/@yoltra/devtools-server)
[![Licencia](https://img.shields.io/npm/l/@yoltra/devtools-server)](https://github.com/yoltra/yoltra/blob/main/LICENSE)

**Hub WebSocket central que intermedia el tráfico del protocolo de DevTools entre stores de
Yoltra y extensiones.**

`@yoltra/devtools-server` ejecuta un servidor WebSocket solo en localhost que maneja los
handshakes del protocolo, enruta mensajes entre stores y UIs de DevTools, y mantiene un búfer
circular de eventos recientes para las extensiones que se conectan tarde.

> **Documentación completa:** [@yoltra/devtools-server en yoltra.dev](https://yoltra.dev/es/yoltra/packages/devtools-server/)

## Instalación

```bash
npm install @yoltra/devtools-server
```

## Inicio rápido

Como librería, empotrado en tus propias herramientas de desarrollo:

```typescript
import { DevtoolsHub } from "@yoltra/devtools-server";

const hub = new DevtoolsHub({ port: 9800 });
await hub.start();
```

Como CLI independiente. Para exigir un token a cada cliente, pasa `--token <secret>` o define
`YOLTRA_DEVTOOLS_TOKEN`, y da el mismo valor a cada agente de store y panel como `authToken`:

```bash
YOLTRA_DEVTOOLS_TOKEN=s3cret npx @yoltra/devtools-server --port 9800
```

## Cómo funciona

Los stores se conectan y hacen el handshake; sus eventos se **difunden** a todos los paneles, los
comandos de un panel se **enrutan** a un store por `storeId`, y los eventos recientes se
**guardan** en un `RingBuffer` para los paneles que llegan tarde. Cada trama pasa los mismos
filtros (origen, forma, tasa, handshake). Un id de store pertenece a una sola conexión a la vez,
así que stores con el mismo nombre necesitan `storeId` distintos. Ver el
[diagrama del hub](https://yoltra.dev/es/yoltra/packages/devtools-server/#cómo-funciona).

```mermaid
flowchart TD
    accTitle: Cómo enruta mensajes el hub
    accDescr: El hub revisa el origen y el handshake de cada conexión, limita la tasa de frames, reparte los eventos de los stores a los paneles con un historial y envía los comandos de un panel a un store
    agentIn(["agente de store<br/>withDevtools"])
    panelIn(["panel<br/>HubProvider en storeview, la CLI o tu propia UI"])

    subgraph hub ["DevtoolsHub"]
    direction TB
        verify{"verifyClient: ¿Origin permitido?<br/>ninguno, extensión, loopback o allowedOrigins"}
        verify -->|"no"| refused(["upgrade rechazado"])
        verify -->|"sí"| conn["handleConnection<br/>tope de trama 8 MiB, handshake en 5 s"]
        conn -->|"cada trama"| shape{"¿objeto JSON con type de texto?"}
        shape -->|"no"| ignored(["ignorada"])
        shape -->|"sí"| rate{"¿bajo maxMessagesPerSecond?<br/>200 por defecto, ventana de 1 s"}
        rate -->|"no"| dropped(["descartada, un aviso por ventana"])
        rate -->|"sí"| shaken{"¿handshake hecho?"}
        shaken -->|"no"| hs["handleHandshake<br/>authToken, versión mayor, id del rol,<br/>id de store que no esté ya conectado"]
        hs -->|"rechazado"| close1008(["cierre 1008"])
        hs -->|"aceptado"| register["Router.register<br/>mapa de stores o de extensiones"]
        register -->|"store"| joined["construye STORE_CONNECTED"]
        register -->|"extensión"| greet["envía STORE_REGISTRY, luego el historial<br/>de los stores aún conectados"]
        shaken -->|"sí"| route{"routeMessage: ¿rol del emisor?"}
        route -->|"store"| fan["Router.fanOutToExtensions<br/>STORE_METRICS solo a paneles con performanceMetrics"]
        fan -->|"solo STORE_EVENT"| ring["RingBuffer.push<br/>historySize, 1000 por defecto, sobrescribe el más antiguo"]
        ring -.->|"se lee en el siguiente handshake de panel"| greet
        route -->|"extensión"| target["Router.sendToStore(storeId)<br/>se descarta si ese store ya no está"]
        conn -->|"cierre del socket"| unreg["Router.unregister"]
        unreg -->|"store"| left["construye STORE_DISCONNECTED"]
    end

    agentIn -->|"WebSocket"| verify
    panelIn -->|"WebSocket"| verify
    fan --> panelOut(["todos los paneles conectados"])
    joined --> panelOut
    left --> panelOut
    greet --> panelNew(["el panel que acaba de conectarse"])
    target --> agentOut(["el agente del store destino"])
```

## Configuración

`new DevtoolsHub(options)` recibe un `DevtoolsHubOptions`: `port` (`9800`), `host`
(`"127.0.0.1"`), `historySize` (`1000`), `authToken`, `allowedOrigins`, `allowedExtensionIds` y
`maxMessagesPerSecond` (`200`).

## Referencia de la API

`new DevtoolsHub(opts?)`, `hub.start()`, `hub.stop()`, `DevtoolsHub.probe(port)`, los contadores
`storeCount`, `extensionCount` y `historySize`, y `RingBuffer<T>`, el búfer de tamaño fijo detrás
del historial: ver la [referencia de la API](https://yoltra.dev/es/yoltra/api/devtools-server/).

## Sondear antes de arrancar

Evita conflictos de puerto: `await DevtoolsHub.probe(9800)` es `true` cuando ya hay un hub
escuchando en ese puerto, así que arranca el tuyo solo cuando sea `false`.

## Seguridad

El hub escucha en `127.0.0.1` (solo localhost) por defecto, una restricción deliberada para v1: no
se expone a la red. Aun así, loopback no es una frontera de autenticación, así que define
`authToken` donde no confíes en los demás procesos locales. Acepta un `Origin` ausente o uno de
loopback, de extensión o de la lista (`allowedExtensionIds` acota las extensiones), limita la tasa
de mensajes de cada cliente y cierra al que no completa el handshake en 5 segundos.

## Paquetes relacionados

- **[@yoltra/devtools-protocol](../devtools-protocol/README.es.md)**: formato de cable y tipos de mensaje
- **[@yoltra/devtools-browser-agent](../devtools-browser-agent/README.es.md)**: conecta stores del navegador a este hub

## Licencia

**MIT**. De uso libre en proyectos comerciales y de código abierto.

> **Documentación completa:** [@yoltra/devtools-server en yoltra.dev](https://yoltra.dev/es/yoltra/packages/devtools-server/)
