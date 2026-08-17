![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

# @yoltra/devtools-cli

> 👉 🇲🇽 Versión en Español&nbsp; | &nbsp;[ 🇺🇸 English Version](./README.md)&nbsp;

**UI de terminal para Yoltra DevTools — inspecciona stores desde la línea de comandos.**

`@yoltra/devtools-cli` es una aplicación de terminal hecha con React + Ink que empotra un hub de
DevTools y renderiza una TUI completa para inspeccionar stores de Yoltra. Útil para depurar
servidores Node.js, entornos sin interfaz gráfica y sesiones SSH donde no hay navegador
disponible.

---

## Instalación

```bash
npm install -g @yoltra/devtools-cli
```

O ejecútalo directamente:

```bash
npx @yoltra/devtools-cli
```

---

## Inicio rápido

```bash
# Arranca la CLI (levanta el hub en el puerto 9800 automáticamente)
npx @yoltra/devtools-cli

# Puerto y tamaño de historial personalizados
npx @yoltra/devtools-cli --port 8900 --history-size 2000
```

Después, instrumenta tu store en otro proceso:

```typescript
import { withNodetools } from "@yoltra/devtools-node-agent";

withNodetools(store, { port: 9800 });
```

La CLI mostrará los stores conectados y los datos de eventos en vivo.

---

## Características

- Hub de DevTools empotrado (arranca solo, y se omite si ya hay uno corriendo)
- Selector de stores por pestañas para varios stores conectados
- Línea de tiempo de eventos con canal y tipo
- Explorador interactivo del árbol de estado
- Panel de suscripciones (reducers, efectos, middleware)
- Panel de métricas de rendimiento
- Emisor de eventos para inyectar eventos de prueba
- Navegación por teclado con gestión del foco

---

## Paneles

| Panel         | Tecla | Descripción                                                  |
| ------------- | ----- | ------------------------------------------------------------ |
| Events        | `1`   | Flujo de eventos en vivo con canal, tipo y marca de tiempo   |
| State         | `2`   | Árbol de estado plegable con los valores actuales            |
| Subscriptions | `3`   | Reducers, efectos y middleware registrados                   |
| Metrics       | `4`   | Conteo de eventos, tasa, tiempo de proceso, profundidad cola |
| Emit          | `5`   | Compone y emite eventos al store seleccionado                |

---

## Opciones de la CLI

| Flag             | Por defecto | Descripción                                            |
| ---------------- | ----------- | ------------------------------------------------------ |
| `--port`         | `9800`      | Puerto del servidor hub                                |
| `--history-size` | `1000`      | Máximo de eventos retenidos para clientes tardíos      |

Estos símbolos también se exportan (`parseArgs`, `CliArgs`, `CliArgsError`, `DEFAULT_PORT`,
`DEFAULT_HISTORY_SIZE`), así que un proceso que empotre el hub puede reutilizar el mismo contrato
de argumentos en vez de volver a deducirlo.

---

## Cómo funciona

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  Tu app      │     │  CLI         │     │  TUI de Ink  │
│  (con        │ WS  │  (hub        │     │  (React +    │
│  withNodetools────►│  empotrado)  │────►│   Ink)       │
│  )           │     │              │     │              │
└──────────────┘     └──────────────┘     └──────────────┘
```

1. La CLI arranca un `DevtoolsHub` empotrado (o detecta uno existente mediante `probe()`)
2. La TUI de Ink se conecta al hub como extensión usando los hooks de `@yoltra/devtools-ui`
3. El agente del store de tu app se conecta al hub por WebSocket
4. Eventos, estado y comandos fluyen por el hub en tiempo real

---

## Arquitectura

| Archivo                             | Responsabilidad                                          |
| ----------------------------------- | -------------------------------------------------------- |
| `index.ts`                          | Punto de entrada, parseo de argumentos, ciclo de vida hub |
| `app.tsx`                           | Componente raíz de Ink con `HubProvider`                  |
| `components/StoreTabs.tsx`          | Selector de stores por pestañas                           |
| `components/EventTimeline.tsx`      | Registro de eventos en terminal                           |
| `components/StateTree.tsx`          | Árbol de estado plegable                                  |
| `components/SubscriptionsPanel.tsx` | Inventario de suscripciones                               |
| `components/MetricsDashboard.tsx`   | Contadores de rendimiento                                 |
| `components/EventEmitter.tsx`       | Formulario de composición de eventos                      |
| `components/StatusBar.tsx`          | Barra de estado de la conexión                            |
| `hooks/useKeyBindings.ts`           | Gestión de atajos de teclado                              |
| `hooks/useFocusManager.ts`          | Ciclado del foco entre paneles                            |

---

## Paquetes relacionados

- **[@yoltra/devtools-server](../devtools-server/README.md)** — El hub que empotra esta CLI
- **[@yoltra/devtools-ui](../devtools-ui/README.md)** — Hooks de React que dan lógica a la TUI
- **[@yoltra/devtools-protocol](../devtools-protocol/README.md)** — Formato de cable para hablar
  con el hub
- **[@yoltra/devtools-node-agent](../devtools-node-agent/README.md)** — Agente para conectar
  stores de Node.js
- **[@yoltra/devtools-browser-agent](../devtools-browser-agent/README.md)** — Agente para conectar
  stores del navegador
- **[@yoltra/devtools-ext](../devtools-ext/README.md)** — Alternativa: extensión de navegador

---

## Licencia

**MIT** — De uso libre en proyectos comerciales y de código abierto.
