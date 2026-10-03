![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

# @yoltra/devtools-storeview

> 👉 🇲🇽 Versión en Español&nbsp; | &nbsp;[ 🇺🇸 English Version](./README.md)&nbsp;

[![versión npm](https://img.shields.io/npm/v/@yoltra/devtools-storeview)](https://www.npmjs.com/package/@yoltra/devtools-storeview)
[![descargas npm](https://img.shields.io/npm/dm/@yoltra/devtools-storeview)](https://www.npmjs.com/package/@yoltra/devtools-storeview)
[![tipos](https://img.shields.io/npm/types/@yoltra/devtools-storeview)](https://www.npmjs.com/package/@yoltra/devtools-storeview)
[![Licencia](https://img.shields.io/npm/l/@yoltra/devtools-storeview)](https://github.com/yoltra/yoltra/blob/main/LICENSE)

**UI de React DOM para Yoltra DevTools: el inspector visual de stores.**

`@yoltra/devtools-storeview` ofrece una aplicación de React completa para inspeccionar stores de
Yoltra en tiempo real: líneas de tiempo de eventos, árboles de estado, suscripciones, métricas de
rendimiento, controles de viaje en el tiempo y un emisor de eventos. La usan tanto el panel de la
extensión de navegador como la webview de VSCode.

> **Documentación completa:** [@yoltra/devtools-storeview en yoltra.dev](https://yoltra.dev/es/yoltra/packages/devtools-storeview/)

## Instalación

```bash
npm install @yoltra/devtools-storeview
```

**Dependencias peer:** `react` ^18, `react-dom` ^18

## Inicio rápido

`mountDevtools(container, { port: 9800, extensionName, autoReconnect })` monta la app completa en
un elemento del DOM y devuelve `unmount()`. Si el hub se inició con un token, pasa el mismo valor
en `authToken`. En React, renderiza el componente raíz:

```tsx
import { DevtoolsApp } from "@yoltra/devtools-storeview";

function MyPanel() {
  return <DevtoolsApp config={{ port: 9800, extensionName: "My Panel" }} />;
}
```

## Paneles

Cuatro pestañas, cada una respaldada por hooks de `@yoltra/devtools-ui`: **Inspector** (línea de
tiempo de eventos con filtros, detalle por evento, el motivo de un evento no confirmado y un
compositor **Emit**), **State** (árbol JSON en vivo), **Time Travel** (avanzar, saltar, volver al
modo en vivo) y **Metrics** (tiempos, aciertos de dedup, profundidad de cola y el inventario de
suscripciones). La disposición es un `TopBar` con el selector de store, una barra de pestañas, el
panel activo y un `BottomBar` con el estado de la conexión.

## Cómo funciona

`DevtoolsApp` no tiene lógica de protocolo propia: envuelve `HubProvider` de
`@yoltra/devtools-ui`, ejecuta los hooks de ese paquete para el store seleccionado y pasa los
resultados a paneles de presentación. Las capacidades del store deciden qué pestañas aparecen, así
que un store que no puede hacer replay nunca muestra Time Travel. La página del paquete tiene el
[diagrama](https://yoltra.dev/es/yoltra/packages/devtools-storeview/#cómo-funciona).

```mermaid
flowchart TD
    accTitle: Cómo se monta storeview
    accDescr: mountDevtools dibuja DevtoolsApp, que se conecta por HubProvider y muestra cada pestaña solo cuando las capacidades del store seleccionado lo permiten
    host(["una página anfitriona: el panel de la extensión,<br/>un webview o tu app"])
    hub(["un hub, o un broker loopback"])

    subgraph sv ["@yoltra/devtools-storeview"]
    direction TB
        mount["mountDevtools(container, config)<br/>createRoot, devuelve unmount"] --> app["DevtoolsApp<br/>ThemeProvider, oscuro por defecto"]
        app --> provider["HubProvider<br/>de @yoltra/devtools-ui"]
        provider --> inner["DevtoolsInner<br/>store seleccionado, el primero por defecto"]
        inner --> hooks["useStoreRegistry, useEventLog, useStoreState,<br/>useStoreSubscriptions, useStoreMetrics,<br/>useEventEmitter, useEventReplay, useTimeTravel"]
        inner --> bars["TopBar: selector de store<br/>BottomBar: estado, número de eventos, versión del protocolo"]
        hooks --> policy{"tabRequires(tab, capabilities)"}
        policy -->|"siempre"| inspector["Inspector<br/>línea de tiempo, detalle del evento,<br/>EventEmitterPanel si emit está activo"]
        policy -->|"siempre"| metrics["MetricsDashboard<br/>contadores e inventario de suscripciones"]
        policy -->|"stateSnapshot"| stateTab["StateTreeExplorer<br/>JsonTree, refrescar"]
        policy -->|"replay"| ttTab["TimeTravelPanel<br/>barra de desplazamiento, previewState, replay"]
        inspector -->|"emit: EMIT_TO_STORE"| hooks
        ttTab -->|"jumpTo, resume: TIME_TRAVEL<br/>replay: EVENT_REPLAY"| hooks
    end

    host --> mount
    host -->|"o renderiza DevtoolsApp directamente"| app
    hub <-->|"tramas del protocolo"| provider
```

## Componentes exportados

`mountDevtools` y `DevtoolsApp`; las piezas de disposición `TopBar` y `BottomBar`; los paneles
`EventTimeline`, `StateTreeExplorer`, `SubscriptionsPanel`, `TimeTravelPanel`,
`EventEmitterPanel` y `MetricsDashboard`; y los compartidos `JsonTree`, `FilterBar` y
`ConnectionDot`. Ver la [referencia de la API](https://yoltra.dev/es/yoltra/api/devtools-storeview/).

## Temas

CSS Modules con propiedades personalizadas de CSS. `styles/vscode-theme.css` es un tema
compatible con VSCode para paneles de tipo webview.

## Paquetes relacionados

- **[@yoltra/devtools-ui](../devtools-ui/README.es.md)**: hooks y lógica sobre los que se construye esta UI
- **[@yoltra/devtools-protocol](../devtools-protocol/README.es.md)**: formato de cable y tipos de mensaje
- **[@yoltra/devtools-ext](../devtools-ext/README.es.md)**: extensión de navegador que monta esta app

## Licencia

**MIT**. De uso libre en proyectos comerciales y de código abierto.

> **Documentación completa:** [@yoltra/devtools-storeview en yoltra.dev](https://yoltra.dev/es/yoltra/packages/devtools-storeview/)
