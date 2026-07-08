![Yoltra logo](../../assets/yoltra-logo.png)

# Yoltra

> 👉 🇲🇽 Versión en Español | [ 🇺🇸 English Version](../../README.md)

![npm downloads](https://badgen.net/npm/dm/@yoltra/core)
![License](https://img.shields.io/npm/l/@yoltra/core)

**Estado reactivo de grano fino, basado en eventos (event-sourced) y con devtools de viaje en el
tiempo — para aplicaciones complejas e interactivas.**

![Kinetic Logo Demo](../../assets/yoltra-dots.gif)

> 3000 círculos, cada uno suscrito a su propia posición. Cada círculo se re-renderiza de forma
> independiente --- el resto del árbol no se toca. Sin selectores. Sin memoización.
> [Ver el código fuente de la demo.](https://github.com/yoltra/yoltra/blob/main/examples/v0/yoltra-kinetic-logo/README.md)

---

## La propuesta en 30 segundos

Una sola llamada te da el store **y** los hooks totalmente tipados. Te suscribes a una ruta con un
accessor tipado, y el componente se re-renderiza solo cuando esa hoja exacta cambia:

```tsx
import { createYoltra } from "@yoltra/react";

// Una llamada — store + hooks tipados. Sin context, sin createHooks, sin boilerplate.
export const { useAtomicProp, useEmit } = createYoltra({
  name: "App",
  reducer: {
    todos: {
      state: { items: [{ id: "1", title: "Buy milk", done: false }] },
      events: [["todos", "rename"]],
      reducer: (s, e) =>
        e.type === "rename"
          ? { items: s.items.map((t) => (t.id === e.payload.id ? { ...t, title: e.payload.title } : t)) }
          : s,
    },
  },
});

function TodoTitle() {
  // Accessor tipado: autocompleta `items[0].title` e infiere `string`.
  // Se re-renderiza SOLO cuando esa hoja exacta cambia — sin selectores, sin memo.
  const title = useAtomicProp("todos", (s) => s.items[0].title);
  const emit = useEmit();
  return <span onClick={() => emit("todos", "rename", { id: "1", title: "New title" })}>{title}</span>;
}
```

La suscripción _es_ la optimización.

> Yoltra es un fork de [Quo.js](https://github.com/quojs/quojs). Dejamos de usar el nombre
> **Quo.js** para no luchar en SEO con librerías zombis (están muertas, pero siguen merodeando).

---

## Qué hace diferente a Yoltra

La mayoría de las librerías de estado te obligan a elegir dos de las siguientes. Yoltra está
construido para darte las cuatro a la vez --- y en esa intersección es donde vive:

| | Grano fino (sin memo manual) | Log de eventos + viaje en el tiempo | Setup de una llamada | Rutas tipadas / tipos de extremo a extremo |
| --- | :---: | :---: | :---: | :---: |
| **Redux Toolkit** | ✗ selectores + memo | ✓ (por eso muchos se quedan) | ✗ boilerplate | parcial |
| **Zustand** | ✗ igualdad manual | ✗ | ✓ | parcial |
| **Jotai / Recoil** | ✓ átomos | ✗ | ✓ | ✓ |
| **Valtio / MobX** | ✓ magia de proxy | ✗ | ✓ | parcial |
| **Signals** | ✓ | ✗ | ✓ | ✓ |
| **Yoltra** | ✓ suscripciones por ruta | ✓ **integrado** | ✓ `createYoltra` | ✓ accessors tipados |

El campo de grano fino (Jotai, Valtio, signals) tiene devtools pobres y no tiene log de eventos. El
campo basado en eventos (Redux) tiene grandes devtools pero reactividad gruesa y boilerplate.
**Yoltra es el único lugar donde obtienes reactividad de grano fino, un log de eventos con viaje en
el tiempo real, setup de una llamada y tipado completo --- juntos.** Una comparación más profunda y
honesta está en la
[comparación de librerías](./design/state-management-library-comparison.md).

---

## Funcionalidades clave

### Grano fino por defecto --- borra tus `useMemo`

Suscríbete a `items.0.title` o al comodín `items.*.done` y re-renderiza solo cuando esa ruta exacta
cambie --- a través de objetos anidados, arrays y claves dinámicas. Sin selectores, sin memoización,
sin `React.memo` en cada hoja.

```tsx
// Accessor tipado — autocompleta la forma e infiere el tipo de retorno
const title = useAtomicProp("todos", (s) => s.items[0].title);

// Forma string (para rutas dinámicas) + comodín
const allDone = useAtomicProp({ reducer: "todos", property: "items.*.done" }, (s) =>
  s.items.every((i) => i.done),
);
```

[Ver la comparación de flamegraph (Redux vs Yoltra).](https://github.com/yoltra/yoltra/blob/main/examples/v0/yoltra-in-react/redux-yoltra-profiler.md)

### DevTools de viaje en el tiempo que muestran exactamente qué cambió

Como Yoltra está basado en eventos, sus devtools son de primera clase --- no algo agregado después.
El store reporta las **rutas hoja precisas** que cambiaron en cada evento, así que el panel renderiza
parches RFC-6902 exactos (`replace /todos/items/0/title`), un log de eventos filtrable con eventos
confirmados/rechazados, métricas reales (tiempo de reducción, aciertos de dedup, profundidad de cola)
y **viaje en el tiempo + repetición de eventos**. Esta es la capacidad que el campo de grano fino no
puede igualar fácilmente.

### Una sola llamada para configurar --- sin boilerplate

`createYoltra(spec)` devuelve el store y cada hook tipado (`useAtomicProp`, `useEmit`, `useEvent`,
`useSelector`, …). Los hooks usan ese store por defecto, así que un `<Provider>` es opcional. Sin
archivo de context aparte, sin cableado de `createHooks`.

### `emit` predecible y honesto

La fase de reducción (middleware → reducers → suscriptores → oyentes gruesos) se ejecuta de forma
**síncrona**, así que `getState()` es correcto en el instante en que `emit()` retorna --- incluso con
middleware. Los efectos corren después, de forma asíncrona, y la promesa devuelta se resuelve solo
cuando los efectos de _ese_ evento terminan. Sin lecturas obsoletas, sin "a veces síncrono, a veces
asíncrono".

### Eventos que puedes interceptar, rechazar y auditar

Los eventos son tuplas `(channel, type, payload)` --- un _namespacing_ natural que escala sin
colisiones. Fluyen a través de un pipeline interceptable. El middleware puede **rechazar** un evento,
produciendo un evento _no confirmado_ al que tu UI puede reaccionar --- ideal para autorización,
validación y UI optimista:

```tsx
await emit("auth", "login", credentials);
await emit("analytics", "track", event);

// Reacciona cuando el middleware bloquea un delete
useEvent("ui", "delete", () => showToast("La eliminación fue bloqueada por permisos"), "uncommitted");
```

### Sin sorpresas silenciosas

La deduplicación por contenido está **desactivada por defecto** --- Yoltra nunca traga en silencio
dos eventos rápidos legítimos (doble-clic, `+1` repetido). Actívala con `dedupWindowMs`, o usa un
`dedupKey` por-emit para dedup basado en identidad (p. ej. un doble-render de React Strict Mode). Las
escrituras cuestan O(cambio), no O(tamaño del estado): una actualización de un solo campo nunca clona
ni vuelve a congelar toda la slice.

---

## Paquetes

| Paquete | Descripción |
| --- | --- |
| **[@yoltra/core](https://github.com/yoltra/yoltra/blob/main/packages/core/README.md)** | Store agnóstico de framework: reducers, middleware, efectos, detección de cambios de grano fino, instrumentación tipada |
| **[@yoltra/react](https://github.com/yoltra/yoltra/blob/main/packages/react/README.md)** | Hooks de React: suscripciones de grano fino, accessors de ruta tipados, `createYoltra`, Suspense |
| **@yoltra/devtools-\*** | Suite de DevTools: protocolo, servidor hub, agentes de navegador/node y la UI del panel (extensión de navegador + CLI) |

---

## Inicio rápido (React)

[Guía de inicio rápido](./QUICK_START_GUIDE.md) --- una app funcional en menos de 3 minutos.

## DevTools

El store de Yoltra expone una costura de instrumentación tipada (`store.instrument(...)`) que los
agentes consumen con cero casts `as any`. Un pequeño hub retransmite los eventos de tu app en
ejecución hacia el panel; el panel renderiza el log de eventos, el árbol de estado en vivo, los
parches precisos por evento, las métricas y el viaje en el tiempo. Los agentes de navegador y de node
son paquetes deliberadamente separados para que un bundle web nunca arrastre un WebSocket exclusivo de
Node, y viceversa.

---

## Ejemplos en vivo

| Ejemplo | Descripción |
| --- | --- |
| **[Logo cinético (3000 partículas)](https://github.com/yoltra/yoltra/blob/main/examples/v0/yoltra-kinetic-logo/README.md)** | Simulación de física con una suscripción de ruta independiente por círculo |
| **[App de tareas con Profiler](https://github.com/yoltra/yoltra/blob/main/examples/v0/yoltra-in-react/README.md)** | Comparación de flamegraph lado a lado con Redux ([resultados](https://github.com/yoltra/yoltra/blob/main/examples/v0/yoltra-in-react/redux-yoltra-profiler.md)) |
| **[Contador](https://github.com/yoltra/yoltra/blob/main/examples/v0/yoltra-react-counter/README.md)** | El ejemplo mínimo de extremo a extremo |

---

## Documentación

- **[Guía de inicio rápido](https://github.com/yoltra/yoltra/blob/main/docs/en/QUICK_START_GUIDE.md)** --- cinco pasos hacia una app funcional
- **[Guía de migración](https://github.com/yoltra/yoltra/blob/main/docs/es/MIGRATION_GUIDE.md)** --- si vienes de Redux, Zustand o Jotai
- **[Guía de testing](https://github.com/yoltra/yoltra/blob/main/docs/es/TESTING_GUIDE.md)** --- prueba stores, efectos, middleware y componentes
- **[Guía de Next.js](https://github.com/yoltra/yoltra/blob/main/docs/es/NEXTJS_GUIDE.md)** --- uso en cliente con Pages y App Router
- **[API de @yoltra/core](https://github.com/yoltra/yoltra/blob/main/packages/core/README.md)** --- store, middleware, efectos, matchers `When`, instrumentación
- **[API de @yoltra/react](https://github.com/yoltra/yoltra/blob/main/packages/react/README.md)** --- hooks, accessors tipados, `createYoltra`, Suspense
- **[Arquitectura del pipeline de eventos](https://github.com/yoltra/yoltra/blob/main/docs/en/design/event-queue-architecture.md)** --- cómo funciona el pipeline de reducción síncrona / efectos asíncronos
- **[Comparación de librerías](https://github.com/yoltra/yoltra/blob/main/docs/en/design/state-management-library-comparison.md)** --- comparación arquitectónica honesta con Redux, Zustand, Jotai y otras

---

## Contribuir

¡Damos la bienvenida a las contribuciones! Por favor, lee la
[Guía de contribución](https://github.com/yoltra/yoltra/blob/main/CONTRIBUTING.md),
el [Código de conducta](https://github.com/yoltra/yoltra/blob/main/CODE_OF_CONDUCT.md),
la [Gobernanza](https://github.com/yoltra/yoltra/blob/main/GOVERNANCE.md) y la
[Política de seguridad](https://github.com/yoltra/yoltra/blob/main/SECURITY.md).

---

## Desarrollo (Monorepo)

```bash
npm i -g @microsoft/rush
rush install
rush build
rush test
```

Consulta la
**[Guía del desarrollador](https://github.com/yoltra/yoltra/blob/main/docs/en/DEVELOPER_GUIDE.md)**
para más detalles.

---

## Estado

Yoltra está en etapa de **Release Candidate** (v0.1.0):

- Las APIs de core y React son estables y se usan en aplicaciones en producción.
- Los tipos de TypeScript son estrictos y completos.
- La suite de DevTools es la adición más reciente y aún se está estabilizando.
- Las APIs menores aún pueden evolucionar antes de v1.0.

Los comentarios y PRs son bienvenidos.

---

## Licencia

**MIT** --- libre para usar en proyectos comerciales y de código abierto.
Consulta [LICENSE](https://github.com/yoltra/yoltra/blob/main/LICENSE) para más detalles.

---

## Comunidad

- **Sitio web:** [yoltra.dev](https://yoltra.dev)
- **Twitter/X:** [@yoltra_dev](https://twitter.com/yoltra_dev)
- **GitHub Discussions:** [Únete a la conversación](https://github.com/yoltra/yoltra/discussions)
- **Issues:** [Reporta errores o solicita funcionalidades](https://github.com/yoltra/yoltra/issues)
