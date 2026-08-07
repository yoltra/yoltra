![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

# Orbital Mission Control — la demo insignia de Yoltra + DevTools

> [🇺🇸 English](./README.md) &nbsp;|&nbsp; 👉 Español

Una sala de control en vivo de una flota de satélites que pone cada característica de Yoltra —
y el **panel de DevTools** — en una sola pantalla. Sin instalar nada, sin servidor de hub, sin
extensión del navegador: el agente del store, el hub y el panel corren todos en la página sobre
un transporte loopback en memoria.

> 🛰️ **¿Primera vez aquí?** Lee el **[recorrido guiado →](./GUIDE.es.md)** — qué estás viendo,
> cómo leer el panel de DevTools, y cómo manejar el time-travel.

> ⚡ **[Abre la demo en vivo](https://yoltra.dev/es/demos/mission-control)** — sin instalar
> nada, corre en tu navegador.

## Qué muestra

| Característica                   | Dónde mirar                                                                                                                                                                                                                                                        |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Reactividad de grano fino**    | Cada tarjeta de satélite muestra un **contador de renders** en vivo. La telemetría toca un satélite → solo esa tarjeta se re-renderiza. Sin selectores, sin memoización.                                                                                           |
| **Accesores de ruta tipados**    | Las tarjetas se suscriben con `useAtomicProp("fleet", p => p.satellites[i].battery)`.                                                                                                                                                                              |
| **Suscripciones con comodín**    | La *batería de la flota* en la cabecera se recalcula desde `satellites.**`.                                                                                                                                                                                        |
| **Varios slices**                | `fleet` (telemetría + comandos) y `mission` (reloj + alertas).                                                                                                                                                                                                     |
| **Event-sourcing + time-travel** | La línea de tiempo del panel se llena sola; recórrela para rebobinar la misión.                                                                                                                                                                                    |
| **Effects (asíncrono)**          | *Deploy* / *Transmit* / *Boost* se confirman al instante, y un momento después se completan vía effects.                                                                                                                                                           |
| **Middleware (veto)**            | *Boost* por debajo del 20% de batería se rechaza — aparece como **uncommitted** en la línea de tiempo y levanta una alerta.                                                                                                                                        |
| **Suscripciones a eventos**      | El **registro de misión** usa `useEvent` — no lee estado en absoluto, así que la telemetría nunca lo despierta. Escucha en la fase `"all"`, así que un comando *vetado* aparece ahí aunque nunca haya llegado a un reducer.                                        |
| **Deduplicación**                | Los comandos llevan un `dedupKey`. Haz doble clic en **Boost** y la segunda pulsación se colapsa en vez de iniciar una segunda maniobra — observa cómo suben los **dedup hits** en las métricas del panel.                                                         |
| **Suspense**                     | El panel de **ventana de transferencia** usa `useSuspenseAtomicProp` para un pronóstico asíncrono, con un esqueleto mientras calcula. Se suscribe a `satellites.*.panelsDeployed`, así que recalcula cuando se mueven los paneles y no en cada tick de telemetría. |
| **Sistema de diseño**            | El armazón es `@yoltra/ds` — `Card`, `Stack`, `Inline`, `Grid`, `Button`, `Switch`, `Badge`, `Skeleton`, `EmptyState`. Los visuales de telemetría siguen siendo a medida, construidos con los mismos tokens.                                                       |
| **DevTools**                     | El `<DevtoolsApp/>` embebido es exactamente la UI de la extensión, sobre el hub loopback.                                                                                                                                                                          |

## Ejecútalo

El ejemplo consume Yoltra + la suite de devtools desde el `dist/` compilado de cada paquete,
así que compílalos una vez y luego arranca Vite:

```sh
rush build          # o: rush build --to yoltra-mission-control
cd examples/v0/yoltra-mission-control
pnpm dev
```

Después de editar un paquete de Yoltra, recompila solo ese (por ejemplo
`rush build --only @yoltra/devtools-ui`) y recarga.

## Cómo funciona el loopback

```ts
import { createLoopbackHub } from "@yoltra/devtools-ui";

const loopback = createLoopbackHub();

// lado del agente
withDevtools(store, { port: 0, socketFactory: loopback.agentSocketFactory });

// lado del panel
<DevtoolsApp config={{ port: 0, WebSocket: loopback.WebSocket }} />
```

Ambos extremos hablan el protocolo real de DevTools; el loopback simplemente lo transporta en
memoria en vez de sobre un WebSocket. Cambia `socketFactory` / `WebSocket` de vuelta y la misma
aplicación habla con el hub real y la extensión del navegador sin tocar nada más.
