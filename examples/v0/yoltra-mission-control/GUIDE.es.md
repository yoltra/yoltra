![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

# Orbital Mission Control — recorrido guiado

> [🇺🇸 English](./GUIDE.md) &nbsp;|&nbsp; 👉 Español

Un recorrido de dos minutos por lo que estás viendo, qué demuestra cada parte sobre Yoltra, y
cómo manejar el panel de DevTools embebido (incluido el time-travel).

> ¿Primera vez aquí? Empieza por el [README](./README.es.md) para compilarlo y ejecutarlo, y
> vuelve después para este recorrido.

---

## La pantalla de un vistazo

```
┌───────────────────────────────┬──────────────────────────────┐
│  PANEL DE MISIÓN (tu app)     │  PANEL DEVTOOLS (el panel)   │
│                               │                              │
│  • Cabecera + estadísticas    │  Inspector · State ·         │
│  • Control de pausa           │  Time Travel · Metrics       │
│  • Tarjetas de satélite (6)   │                              │
│    – medidores en vivo        │  exactamente la UI de la     │
│    – contador de renders      │  extensión, sobre un hub     │
│    – Boost/Deploy/Transmit    │  en memoria                  │
└───────────────────────────────┴──────────────────────────────┘
```

A la izquierda hay una app de Yoltra normal. A la derecha está el panel **real** de DevTools
(`@yoltra/devtools-storeview`) hablando con el mismo store sobre un loopback en memoria — sin
extensión, sin servidor de hub, sin instalar nada.

---

## Recorrido en 60 segundos

1. **Observa cómo se asientan las tarjetas.** La telemetría entra cada ~0.9s. Cada tarjeta de
   satélite tiene un **contador de renders** — cuando la batería de un satélite avanza, solo el
   contador de *esa* tarjeta se incrementa. Eso es reactividad de grano fino: sin selectores,
   sin `memo`.
2. **Abre el Inspector** (panel derecho, primera pestaña). Los eventos entran en vivo. Haz clic
   en cualquier fila para ver exactamente qué **rutas hoja del estado** cambió.
3. **Pulsa Boost en un satélite con poca batería.** El middleware lo veta — el evento aparece
   como **uncommitted** (rojo) en la línea de tiempo *sin* cambio de estado, y la misión levanta
   una alerta. (El interruptor *Bounced* de la línea de tiempo muestra u oculta esas filas.)
4. **Pausa la telemetría, y luego Time Travel.** Rebobina la misión y observa el estado
   reconstruido; después vuelve a la vista en vivo.
5. **Haz doble clic en un comando.** La segunda pulsación lleva el mismo `dedupKey` que la
   primera y se colapsa — los **dedup hits** suben en la pestaña de métricas mientras solo corre
   una maniobra.
6. **Mira el registro de misión.** Está construido sobre `useEvent`, así que no se suscribe a
   ningún estado. Un boost vetado por el middleware de seguridad aparece ahí igualmente, marcado
   como bloqueado, porque un evento uncommitted existe únicamente en el flujo de eventos.

---

## Cómo se ve cada característica de Yoltra

| Característica                | Dónde mirar                                                                                                                    |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| **Reactividad de grano fino** | El **contador de renders** de cada tarjeta — solo se re-renderiza el satélite que cambió.                                      |
| **Accesores de ruta tipados** | Las tarjetas leen `useAtomicProp("fleet", p => p.satellites[i].battery)` — totalmente tipado, con el tipo de retorno inferido. |
| **Suscripciones con comodín** | La *batería de la flota* en la cabecera se recalcula desde `satellites.**` (cualquier hoja de batería).                        |
| **Varios slices**             | `fleet` (telemetría + comandos) y `mission` (reloj + alertas).                                                                 |
| **Event-sourcing**            | La línea de tiempo del Inspector *es* el log de eventos; cada fila es un evento `channel.type`.                                |
| **Effects (asíncrono)**       | *Deploy* / *Transmit* / *Boost* se confirman al instante, y terminan un momento después vía effects.                           |
| **Veto de middleware**        | *Boost* por debajo del 20% de batería se veta — aparece como **uncommitted** en la línea de tiempo y levanta una alerta.       |
| **Time-travel**               | La pestaña Time Travel rebobina el store a cualquier evento registrado.                                                        |

---

## Cómo leer el panel de DevTools

### Inspector — el flujo de eventos

- **Izquierda:** una línea de tiempo en vivo y filtrable. Cada fila es un evento: un punto de
  estado (**verde = committed**, **rojo = uncommitted**, es decir vetado por middleware), el
  `channel.type`, una **insignia Δ** (cuántas rutas hoja del estado cambió), y la hora.
- **Derecha (al hacer clic en una fila):** el detalle. Aquí está la historia de Yoltra en un
  solo sitio — las **rutas hoja exactas que cambiaron** (por ejemplo
  `fleet.satellites.2.battery`) con sus nuevos valores, más el **payload** que lo disparó. Los
  eventos uncommitted muestran "sin cambio de estado".
- **`+ Emit`:** despacha a mano un evento improvisado al store.

### State — la instantánea en vivo

El estado actual del store como un árbol buscable, mantenido al día aplicando los parches de
cada evento. Escribe en el cuadro de búsqueda para filtrar claves y valores; **Refresh** vuelve
a pedir una instantánea completa.

### Time Travel — reproducir la historia

Un cursor sobre los eventos registrados más una **vista previa del estado reconstruido** en el
punto seleccionado. Ver el flujo de trabajo más abajo.

### Metrics — rendimiento + arquitectura

- **En vivo:** eventos/seg, eventos totales, tiempo medio de procesamiento, profundidad de cola,
  dedup hits, rechazos de middleware.
- **Arquitectura:** cuentas de reducers / effects / middleware / suscriptores / conectores.
- **Consumidores:** los reducers, effects y middleware realmente registrados, y las
  **suscripciones atómicas** en vivo (`reducer.property`) — el cableado de grano fino.

---

## Time-travel, paso a paso

El time-travel rebobina un store **en vivo**, así que el truco está en mantener la línea de
tiempo quieta mientras te desplazas.

1. **Pausa la telemetría.** En el panel de misión, apaga el interruptor **Telemetry live**. La
   etiqueta cambia a **Telemetry paused** y el log de eventos deja de crecer. (Puedes saltarte
   este paso, pero con la telemetría en vivo el store sigue avanzando bajo tus pies.)
2. **Abre la pestaña Time Travel** en el panel.
3. **Desplázate o avanza paso a paso.** Arrastra el deslizador, o usa **‹ Back** / **Forward ›**.
   La vista previa muestra el estado del store reconstruido en ese punto. Back retrocede un
   evento; Forward avanza uno y se deshabilita en el borde en vivo.
4. **Vuelve al vivo.** Pulsa **Resume Live** para devolver el store al último estado, y luego
   vuelve a encender **Telemetry live** para que la misión continúe.

> ¿Por qué pausar? El reloj de la misión emite cada ~0.9s. Mientras corre, la vista previa del
> panel sigue siendo correcta, pero el store (y las tarjetas de satélite) siguen moviéndose —
> pausar hace que toda la demo se quede quieta y el time-travel sea fácil de seguir.

---

## Prueba esto

- **Ver un veto:** deja que un satélite baje del 20%, y pulsa **Boost**. Observa cómo la fila
  del Inspector se pone roja (uncommitted) sin Δ, y cómo sube la cuenta de alertas de la
  cabecera.
- **Ver actualizaciones de grano fino:** pulsa **Transmit** en una tarjeta y observa cómo solo
  se mueve el contador de renders de esa tarjeta; las demás se quedan quietas.
- **Rastrear un cambio:** haz clic en una fila `telemetry.drain` del Inspector y lee la ruta
  cambiada — apunta exactamente a la hoja `battery` de un solo satélite.
- **Rebobinar un comando:** pausa la telemetría, haz Boost/Deploy unas cuantas veces, y luego
  retrocede paso a paso por esos eventos observando el estado reconstruido.

---

## Bajo el capó

El agente del store, el hub y el panel corren todos en la página sobre un transporte loopback en
memoria — ambos extremos hablan el protocolo real de DevTools:

```ts
import { createLoopbackHub } from "@yoltra/devtools-ui";

const loopback = createLoopbackHub();
withDevtools(store, { port: 0, socketFactory: loopback.agentSocketFactory }); // agente
<DevtoolsApp config={{ port: 0, WebSocket: loopback.WebSocket }} />;          // panel
```

Cambia `socketFactory` / `WebSocket` de vuelta y la misma aplicación habla con el hub real y la
extensión del navegador, sin tocar nada más.
