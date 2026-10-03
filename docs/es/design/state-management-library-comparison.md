![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

# Gestión de Estado: Comparación Arquitectónica

> 👉 🇲🇽 Versión en Español&nbsp; | &nbsp;[ 🇺🇸 English Version](https://github.com/yoltra/yoltra/blob/main/docs/en/design/state-management-library-comparison.md)

**Aplica a:** `@yoltra/core` 0.6.0
**Última actualización:** Agosto 2026

Las librerías de gestión de estado hacen distintas **apuestas arquitectónicas**, y esas apuestas deciden qué problemas resuelve cada una de forma natural y dónde genera fricción. Esta página las compara con honestidad, no para declarar un ganador, sino para ayudarte a elegir la herramienta correcta para tu problema.

> **Guía completa:** [Gestión de Estado: Comparación Arquitectónica en yoltra.dev](https://yoltra.dev/es/yoltra/docs/design/state-management-comparison/)

## Introducción

Cada sección describe el modelo central de una librería, las aplicaciones donde sobresale y cómo difiere de Yoltra. La página completa en yoltra.dev tiene el código lado a lado para cada librería.

## Yoltra en Breve

Yoltra hace cuatro apuestas: **suscripciones a nivel de ruta** (los componentes se suscriben a rutas con puntos como `"items.0.title"` y se re-renderizan solo cuando esa ruta cambia); **event sourcing con un pipeline estructurado** (middleware que puede rechazar, luego reducers, suscriptores y oyentes gruesos, todo síncrono, y después los efectos asíncronos; la deduplicación por contenido es opt-in); **eventos tipados por canal** (`(channel, type, payload)` en lugar de strings planos de acción); y **DevTools con introspección de primera** (el viaje en el tiempo, la repetición de eventos y los parches precisos por evento son de primera clase). Brilla con muchos elementos de UI que se actualizan por separado, con autorización o validación en el middleware, y donde importa poder depurar los cambios de estado. Genera fricción donde la granularidad por ruta sobra, donde el tamaño del bundle debe ser mínimo, o donde el equipo prefiere actualizaciones mutables o átomos.

```typescript
// Suscripción por ruta: solo re-renderiza cuando items.0.title cambia
const title = useAtomicProp({ reducer: 'todos', property: 'items.0.title' });

// Evento tipado por canal
await emit('todos', 'toggle', { id: '123' });
```

## Redux Toolkit

Flujo de datos unidireccional con reducers de slice síncronos y puros en un solo store, Immer para actualizaciones inmutables, y thunks o RTK Query para el trabajo asíncrono. Sobresale con equipos grandes y convenciones establecidas, un ecosistema de middleware maduro y unas DevTools sin igual. La diferencia principal es la granularidad: `useSelector` corre en cada dispatch y se descarta por igualdad, mientras que una suscripción por ruta de Yoltra se dispara solo cuando su ruta cambia, así que en una lista de 100 filas solo corre el hook de la fila que cambió. Ambos mantienen los reducers síncronos; Yoltra mantiene también síncrono el middleware y pone el trabajo asíncrono en efectos. Las DevTools de Yoltra muestran parches RFC-6902 precisos, tiempos de reducción, un log de eventos y viaje en el tiempo con repetición.

## Zustand

Actualizaciones directas del estado con una función `set()`, con estado y acciones en una sola llamada a `create()` y sin acciones, reducers ni middleware. Sobresale en simplicidad (cerca de 1KB, casi sin curva de aprendizaje) y en adopción gradual sin providers. Zustand optimiza para el menor código posible; Yoltra, para transiciones explícitas y rastreables mediante eventos con nombre. Los selectores de Zustand corren en cada `set()` y necesitan funciones de igualdad para ser de grano fino, mientras que Yoltra es de grano fino por defecto y su cola FIFO mantiene los eventos en el orden en que se emitieron. Si el tamaño del bundle es la restricción principal (core y react de Yoltra pesan cerca de 15KB), Zustand gana claramente.

## Jotai

Estado distribuido basado en átomos: átomos independientes que derivan unos de otros en un grafo de dependencias, con componentes suscritos a átomos concretos. Sobresale en estado de grano fino y local a componentes, átomos asíncronos pensados para Suspense y estado derivado componible. Ambos son de grano fino, con arquitecturas opuestas: el árbol único de Yoltra facilita coordinar el estado global y serializar el estado completo de la app, mientras que los átomos facilitan unidades de estado autocontenidas y reutilizables. Las actualizaciones de Jotai son implícitas, sin log de eventos ni middleware central; los eventos de Yoltra son explícitos y rastreables, y un solo middleware puede interceptarlos todos.

## MobX

Estado observable con seguimiento automático de dependencias mediante proxies y actualizaciones de estilo mutable. Sobresale en reactividad implícita con poco boilerplate, stores de clases que encajan con la OOP y mutaciones anidadas legibles. MobX es más fácil de usar; Yoltra, con suscripciones explícitas por ruta, es más fácil de depurar. Yoltra impone la inmutabilidad (el estado se congela en profundidad en desarrollo), y sus eventos fluyen por un pipeline formal con middleware, efectos y fases confirmada o no confirmada, mientras que `@action` de MobX agrupa cambios en lugar de registrar un rastro de eventos.

## XState

Máquinas de estados finitos y statecharts, con cada estado y transición declarados de antemano y un modelo de actores para máquinas concurrentes. Sobresale en flujos de trabajo complejos (checkouts, formularios de varios pasos, protocolos), modelado visual y concurrencia basada en actores. XState está hecho para orquestar flujos de trabajo y Yoltra para el estado de aplicación guiado por datos, así que pueden convivir: XState para la lógica del flujo, Yoltra para el estado al que se suscriben muchos elementos de UI. Las definiciones de máquinas son verbosas por diseño, lo que sobra para un estado CRUD general, y XState no tiene suscripciones a nivel de ruta.

## Resumen Arquitectónico

| Librería          | Optimiza para                                       | Tradeoff central                                           |
| ----------------- | --------------------------------------------------- | ---------------------------------------------------------- |
| **Redux Toolkit** | Madurez del ecosistema, convenciones de equipo      | Más boilerplate y configuración, suscripciones más gruesas |
| **Zustand**       | Superficie de API mínima, baja ceremonia            | Menos estructura para flujos asíncronos complejos          |
| **Jotai**         | Átomos distribuidos y composables                   | Más difícil coordinar estado global                        |
| **MobX**          | Reactividad implícita, ergonomía mutable            | Más difícil rastrear y depurar cambios de estado           |
| **XState**        | Corrección de flujos de trabajo, estados imposibles | Verboso para gestión de datos general                      |
| **Yoltra**        | Grano fino + log de eventos + viaje en el tiempo    | Bundle más grande que Zustand; modelo de eventos opinado   |

No hay una librería universalmente "mejor". Fricción mínima y bundle pequeño: Zustand o Jotai. Un equipo que ya conoce Redux: Redux Toolkit. OOP reactiva con actualizaciones mutables: MobX. Modelado de flujos de trabajo complejos: XState. Reactividad de grano fino _y_ un log de eventos con DevTools de viaje en el tiempo real, sin el boilerplate de Redux: Yoltra.

## Lectura Adicional

- **[Arquitectura del Pipeline de Eventos](./event-queue-architecture.md)**: cómo funciona el pipeline de reducción síncrona y efectos asíncronos.
- **[Guía de Inicio Rápido](../QUICK_START_GUIDE.md)**: cinco pasos hacia una app funcional.
- **[@yoltra/core](../../../packages/core/README.es.md)** y **[@yoltra/react](../../../packages/react/README.es.md)**: el store y los hooks.

> **Guía completa:** [Gestión de Estado: Comparación Arquitectónica en yoltra.dev](https://yoltra.dev/es/yoltra/docs/design/state-management-comparison/)
