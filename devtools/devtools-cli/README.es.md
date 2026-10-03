![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

# @yoltra/devtools-cli

> 👉 🇲🇽 Versión en Español&nbsp; | &nbsp;[ 🇺🇸 English Version](./README.md)&nbsp;

[![versión npm](https://img.shields.io/npm/v/@yoltra/devtools-cli)](https://www.npmjs.com/package/@yoltra/devtools-cli)
[![descargas npm](https://img.shields.io/npm/dm/@yoltra/devtools-cli)](https://www.npmjs.com/package/@yoltra/devtools-cli)
[![tipos](https://img.shields.io/npm/types/@yoltra/devtools-cli)](https://www.npmjs.com/package/@yoltra/devtools-cli)
[![Licencia](https://img.shields.io/npm/l/@yoltra/devtools-cli)](https://github.com/yoltra/yoltra/blob/main/LICENSE)

**UI de terminal para Yoltra DevTools: inspecciona stores desde la línea de comandos.**

`@yoltra/devtools-cli` es una aplicación de terminal hecha con React + Ink que empotra un hub de
DevTools y renderiza una TUI completa para inspeccionar stores de Yoltra. Útil cuando prefieres
tener el inspector en una terminal, o en una sesión SSH donde no hay navegador disponible.

> **Documentación completa:** [@yoltra/devtools-cli en yoltra.dev](https://yoltra.dev/es/yoltra/packages/devtools-cli/)

## Instalación

```bash
npm install -g @yoltra/devtools-cli
```

O ejecútalo directamente con `npx @yoltra/devtools-cli`.

## Inicio rápido

```bash
# Arranca la CLI (levanta el hub en el puerto 9800 automáticamente)
npx @yoltra/devtools-cli

# Puerto y tamaño de historial personalizados
npx @yoltra/devtools-cli --port 8900 --history-size 2000
```

Después, conecta el store de tu app a ese hub. `transport: "websocket"` lo envía al hub aunque la
extensión de navegador esté instalada:

```typescript
import { withDevtools } from "@yoltra/devtools-browser-agent";

withDevtools(store, { port: 9800, transport: "websocket" });
```

## Paneles y características

El hub empotrado arranca solo si no hay otro corriendo. Un selector por pestañas lista los stores
conectados, y seis paneles los muestran: **Events** (flujo en vivo), **State** (árbol plegable),
**Time Travel** (para un store con `allowReplay`), **Subscriptions** (reducers, efectos,
middleware), **Metrics** y **Emit** (compone eventos de prueba). `Tab` y `Shift+Tab` cambian de
panel, `]` y `[` de store, `←`, `→` y `r` recorren y reanudan el viaje en el tiempo, y `q` sale.
Mientras un campo de Emit tiene el foco toda tecla se escribe en él; `Esc` sale del formulario.

## Opciones de la CLI

| Flag             | Por defecto | Descripción                                            |
| ---------------- | ----------- | ------------------------------------------------------ |
| `--port`         | `9800`      | Puerto del servidor hub                                |
| `--history-size` | `1000`      | Máximo de eventos retenidos para clientes tardíos      |
| `--token`        | ninguno     | Token que el hub exige a cada cliente                  |

`--token` también puede venir de la variable de entorno `YOLTRA_DEVTOOLS_TOKEN`, que lo mantiene
fuera de la lista de procesos; pasa el mismo token a cada agente de store (`authToken`).
`parseArgs`, `CliArgs`, `CliArgsError` y los valores por defecto se exportan para herramientas
que empotran el hub.

## Cómo funciona

La CLI es un hub opcional y un panel en un mismo proceso. Arranca un `DevtoolsHub` solo cuando
`DevtoolsHub.probe` no encuentra nada escuchando en el puerto, y la UI de Ink siempre se conecta
como una extensión normal mediante `HubProvider` de `@yoltra/devtools-ui`, así que se comporta
igual con su propio hub o con uno que ya corre. La página del paquete tiene el
[diagrama y la estructura del código](https://yoltra.dev/es/yoltra/packages/devtools-cli/#arquitectura).

```mermaid
flowchart TD
    accTitle: Cómo arranca la CLI
    accDescr: La CLI lee sus opciones, reutiliza un hub en marcha o inicia el suyo, y dibuja los paneles en la terminal con los hooks de devtools-ui
    run(["npx @yoltra/devtools-cli --port 9800 --history-size 1000"])
    agent(["el agente del store de tu app<br/>withDevtools"])
    hubNode(["hub en 127.0.0.1:port"])

    subgraph cli ["@yoltra/devtools-cli"]
    direction TB
        args["parseArgs<br/>valida rangos, CliArgsError sale con 2"]
        args --> probe{"DevtoolsHub.probe(port)<br/>¿ya hay un socket escuchando?"}
        probe -->|"no"| start["DevtoolsHub.start<br/>empotrado, se detiene al salir de la CLI"]
        probe -->|"sí"| reuse["reutiliza el hub en marcha"]
        start --> render["render(App) de Ink"]
        reuse --> render
        render --> provider["HubProvider<br/>extensionName CLI DevTools"]
        provider --> inner["AppInner<br/>hooks de devtools-ui para el store seleccionado"]
        keys["useKeyBindings y useFocusManager<br/>Tab y Shift+Tab: panel, corchetes: store,<br/>flechas y r: viaje en el tiempo, q: salir"] --> inner
        inner --> tabs["Events, State, Time Travel,<br/>Subscriptions, Metrics, Emit"]
    end

    run --> args
    start -.->|"escucha como"| hubNode
    reuse -.->|"usa"| hubNode
    agent <-->|"WebSocket"| hubNode
    hubNode <-->|"WebSocket"| provider
```

## Paquetes relacionados

- **[@yoltra/devtools-server](../devtools-server/README.es.md)**: el hub que empotra esta CLI
- **[@yoltra/devtools-ui](../devtools-ui/README.es.md)**: hooks de React que dan lógica a la TUI
- **[@yoltra/devtools-protocol](../devtools-protocol/README.es.md)**: formato de cable para hablar con el hub
- **[@yoltra/devtools-browser-agent](../devtools-browser-agent/README.es.md)**: agente para stores del navegador
- **[@yoltra/devtools-ext](../devtools-ext/README.es.md)**: la alternativa, una extensión de navegador

## Licencia

**MIT**. De uso libre en proyectos comerciales y de código abierto.

> **Documentación completa:** [@yoltra/devtools-cli en yoltra.dev](https://yoltra.dev/es/yoltra/packages/devtools-cli/)
