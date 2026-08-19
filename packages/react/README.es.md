![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

# @yoltra/react

> 👉 🇲🇽 Versión en Español&nbsp; |
> &nbsp;[ 🇺🇸 English Versión](./README.md)&nbsp;

![npm downloads](https://badgen.net/npm/dm/@yoltra/react)
![License](https://badgen.net/npm/license/@yoltra/react)

**Hooks de React para [yoltra](../../README.md) con
suscripciones de grano fino por ruta.**

Suscríbete a `"items.0.title"` o `"items.*.done"`. El componente se re-renderiza solo cuando
esa ruta exacta cambia. Sin selectores, sin memoización, sin optimización manual.

[Ver la comparación de flamegraph (Redux vs yoltra).](https://github.com/yoltra/yoltra/blob/main/examples/v0/yoltra-in-react/redux-yoltra-profiler.md)

---

## Instalación

```bash
npm install @yoltra/core @yoltra/react
```

**Dependencias peer:** React 18+

---

## Configuración con `createYoltra` (recomendado)

`createYoltra` crea el store **y** todos los hooks tipados en una sola llamada, sin archivo de
context aparte, sin cableado de `createHooks`, sin provider obligatorio. Todos los parámetros de
tipo se infieren de tu reducer, así que los componentes no necesitan generics explícitos.

### 1. Crea el store y los hooks

```tsx
// yoltra.ts
import { eventKeys } from "@yoltra/core";
import { createYoltra } from "@yoltra/react";

export type AppEM = {
  counter: { increment: number; decrement: number; reset: null };
};

export const { store, useAtomicProp, useEmit, StoreProvider } = createYoltra({
  name: "App",
  reducer: {
    counter: {
      state: { value: 0 },
      when: {
        keys: eventKeys<AppEM>()([
          ["counter", "increment"],
          ["counter", "decrement"],
          ["counter", "reset"],
        ]),
      },
      reducer: (state, event) => {
        switch (event.type) {
          case "increment":
            return { value: state.value + event.payload };
          case "decrement":
            return { value: state.value - event.payload };
          case "reset":
            return { value: 0 };
          default:
            return state;
        }
      },
    },
  },
});
```

### 2. Usa los hooks, sin provider

Los hooks usan por defecto el store de arriba, así que puedes renderizar componentes directamente.
Suscríbete con una spec **`{ reducer, property }`**: el `property` con puntos nombra la ruta exacta
a leer.

```tsx
// Counter.tsx
import { useAtomicProp, useEmit } from "./yoltra";

export function Counter() {
  // Forma objeto: se re-renderiza solo cuando counter.value cambia. Sin selectores, sin memo.
  const value = useAtomicProp({ reducer: "counter", property: "value" });
  const emit = useEmit();

  return (
    <div>
      <h1>Count: {value}</h1>
      <button onClick={() => emit("counter", "increment", 1)}>+</button>
      <button onClick={() => emit("counter", "decrement", 1)}>-</button>
      <button onClick={() => emit("counter", "reset", null)}>Reset</button>
    </div>
  );
}
```

Un `<StoreProvider>` solo se necesita para acotar una instancia **diferente** del store a un
subarbol (p. ej. un store nuevo por test). `createYoltra` devuelve uno justo para eso.

---

## Avanzado: cableado manual con `createHooks`

Cuando necesites un mismo conjunto de hooks compartido entre varias instancias de store a través
de tu propio context de React, vinculalos tu mismo con `createHooks(context)`. `createYoltra` es
este mismo cableado colapsado en una sola llamada.

```typescript
// hooks.ts
import { createContext } from "react";
import { createHooks } from "@yoltra/react";
import type { StoreInstance } from "@yoltra/core";
import type { AppState, AppEM } from "./store";

export const AppStoreContext = createContext<StoreInstance<"counter", AppState, AppEM> | null>(
  null,
);

export const {
  useStore,
  useEmit,
  useSelector,
  useAtomicProp,
  useAtomicProps,
  useEvent,
  useSuspenseAtomicProp,
  useSuspenseAtomicProps,
  shallowEqual,
} = createHooks(AppStoreContext);
```

Provee el store con `<AppStoreContext.Provider value={store}>` en tu raíz.

---

## API de Hooks

### `useAtomicProp({ reducer, property }, map?, isEqual?)`

Selector de ruta única con grano fino. Se re-renderiza solo cuando la hoja especificada cambia. El
`property` con puntos nombra la ruta exacta, incluyendo rutas dinámicas
(`` `items.${id}.title` ``) y con comodines.

```tsx
// Forma objeto (recomendada): suscribete a la ruta exacta
const title = useAtomicProp({ reducer: "todos", property: "items.0.title" });

// Ruta dinamica: interpola la clave
const byId = useAtomicProp({ reducer: "todos", property: `items.${id}.title` });

// Con mapper: derivar un valor de la ruta
const count = useAtomicProp({ reducer: "todos", property: "items" }, (items) => items.length);

// Patron wildcard: se re-renderiza cuando cualquier item cambia
const allTitles = useAtomicProp(
  { reducer: "todos", property: "items.**" },
  (state) => state.items.map((t) => t.title),
  shallowEqual,
);
```

> También existe una sobrecarga con accessor tipado, `useAtomicProp("todos", (s) => s.items[0].title)`,
> para rutas estáticas; autocompleta la forma del estado e infiere el tipo de retorno.

**Patrones soportados:**

- `"items.0.title"`: ruta exacta (incluyendo índices numéricos de array)
- `"items.*.title"`: `*` coincide con un segmento
- `"items.**"`: `**` coincide con cero o más segmentos

---

### `useAtomicProps(specs, selector, isEqual?)`

Selector de múltiples rutas. Se suscribe a varias rutas y recalcula cuando alguna cambia.

```tsx
const filtered = useAtomicProps(
  [
    { reducer: "todos", property: "items.**" },
    { reducer: "filter", property: "q" },
  ],
  (state) => state.todos.items.filter((item) => item.title.includes(state.filter.q)),
  shallowEqual,
);
```

---

### `useEvent(channel, type, handler, phase?)`

Suscríbete a eventos del store desde un componente. No afecta el flujo de eventos. Es fire-and-forget.

```tsx
// Eventos confirmados (por defecto): eventos que pasaron el middleware
useEvent("ui", "save", (event) => {
  showToast("Saved!");
});

// Eventos no confirmados: eventos rechazados por el middleware
useEvent(
  "ui",
  "delete",
  (event) => {
    showToast("Delete was blocked by permissions");
  },
  "uncommitted",
);

// Todos los eventos: distinguir por fase
useEvent(
  "ui",
  "action",
  (event, getState, emit, phase) => {
    console.log(`Action ${phase}:`, event.type);
  },
  "all",
);
```

**Fases:**

- `'committed'` (por defecto): eventos que pasaron el middleware y llegaron a los reducers
- `'uncommitted'`: eventos rechazados por el middleware
- `'all'`: ambos, con parámetro `phase` para distinguir

---

### `useEmit()`

Retorna la función `emit` tipada del store (referencia estable).

```tsx
const emit = useEmit();
await emit("counter", "increment", 1);
```

---

### `useSelector(selector, isEqual?)`

Selector de grano grueso vía `useSyncExternalStore`. Se re-renderiza cuando el valor
seleccionado cambia.

```tsx
const count = useSelector((state) => state.counter.value);
```

---

### `useStore()`

Retorna la instancia del store. Lanza error si se llama fuera de un provider.

```tsx
const store = useStore();

// ✅ En un callback o un efecto: lee el valor en el momento en que se quiere.
const onSave = () => save(store.getState());

// ❌ En el cuerpo del render: esto no se suscribe a nada.
const value = store.getState().counter.value;
```

`getState()` es una lectura, no una suscripción. Llamado durante el render, el componente se
renderiza una vez con ese valor y nunca más, porque nada le avisó de que el valor cambió. Parece que
funciona hasta que el estado cambia y la pantalla no. Lee con `useAtomicProp` o `useSelector` lo
que vayas a renderizar, y deja `getState()` para callbacks y efectos, que es para lo que es.

---

## Hooks de Suspense

### `useSuspenseAtomicProp(spec, options)`

Versión compatible con Suspense de `useAtomicProp`. Lanza una promesa mientras carga, capturada
por el boundary `<Suspense>` más cercano.

```tsx
function UserName({ userId }: { userId: string }) {
  const name = useSuspenseAtomicProp(
    { reducer: "users", property: `byId.${userId}.name` },
    {
      load: async (name, slice) => name ?? (await fetchUser(userId)).name,
      staleTime: 30_000,
    },
  );
  return <span>{name}</span>;
}

// Uso
<Suspense fallback={<Spinner />}>
  <UserName userId='123' />
</Suspense>;
```

### `useSuspenseAtomicProps(specs, options)`

Selector Suspense de múltiples rutas.

```tsx
const stats = useSuspenseAtomicProps(
  [
    { reducer: "orders", property: "items.**" },
    { reducer: "users", property: "active" },
  ],
  { load: async (state) => computeDashboardStats(state) },
);
```

### Importalos de tu conjunto de hooks, no del barrel

`createYoltra` y `createHooks` devuelven estos dos junto con el resto, ligados al mismo contexto.
Deliberadamente **no** se exportan desde el barrel del paquete: una copia a nivel de paquete sería
idéntica en forma y aun así lanzaría `useStore must be used inside <StoreProvider>` en tiempo de
ejecución cuando el contexto que lee nunca se lleno, un error que los tipos no podian atrapar.
Importarlos desde cualquier sitio que no sea el resultado de tu propio `createYoltra`/`createHooks`
es ahora un error de compilación, que es el mismo aviso llegando en el momento correcto.

```tsx
// store.ts
export const { store, useAtomicProp, useSuspenseAtomicProp } = createYoltra({ ... });

// Forecast.tsx
import { useSuspenseAtomicProp } from "./store";   // ✅ conoce el store
```

Los valores en cache tienen alcance por store, así que dos stores que compartan nombre de reducer
y ruta mantienen entradas separadas; las utilidades de invalidación de abajo reciben una ruta y la
limpian en todos los stores que la hayan cacheado.

### Utilidades de cache

```typescript
import {
  invalidateAtomicProp,
  invalidateAtomicPropsByReducer,
  clearSuspenseCache,
} from "@yoltra/react";

// Invalidar cache de una ruta especifica
invalidateAtomicProp("users", "byId.123.name");

// Invalidar todas las entradas de cache de un reducer
invalidateAtomicPropsByReducer("users");

// Limpiar todo
clearSuspenseCache();
```

---

## `shallowEqual`

Comparador de igualdad superficial de objetos. Úsalo como argumento `isEqual` cuando tu valor
derivado es un objeto plano:

```tsx
const todos = useAtomicProp(
  { reducer: "todos", property: "items.**" },
  (state) => state.items.map((t) => ({ id: t.id, title: t.title })),
  shallowEqual,
);
```

---

## Rendimiento: Antes y Después

### Antes (grano grueso)

```tsx
// Cada TodoItem se re-renderiza cuando CUALQUIER tarea cambia
function TodoList() {
  const todos = useSelector((state) => state.todos.items);
  return todos.map((todo) => <TodoItem key={todo.id} todo={todo} />);
}
```

### Después (grano fino con yoltra)

```tsx
// Cada TodoItem se re-renderiza SOLO cuando sus propios datos cambian
function TodoItem({ index }: { index: number }) {
  const title = useAtomicProp({
    reducer: "todos",
    property: `items.${index}.title`,
  });
  const done = useAtomicProp({
    reducer: "todos",
    property: `items.${index}.done`,
  });
  return <div className={done ? "done" : ""}>{title}</div>;
}
```

[Ver la comparación completa de flamegraph.](https://github.com/yoltra/yoltra/blob/main/examples/v0/yoltra-in-react/redux-yoltra-profiler.md)

---

## Compatibilidad con React 18+

- **Concurrent Mode:** Totalmente compatible. Todos los hooks usan `useSyncExternalStore`.
- **Strict Mode:** La deduplicación de eventos previene el doble procesamiento.
- **Suspense:** `useSuspenseAtomicProp` y `useSuspenseAtomicProps` lanzan promesas para
  boundaries `<Suspense>`.

---

## Ejemplos

- **[App de Tareas con Profiler](../../examples/v0/yoltra-in-react)**: CRUD completo con
  comparación de flamegraph · [▶ Abrir la demo en vivo](https://yoltra.dev/es/demos/in-react)
- **[Logo Cinético (3000 particulas)](../../examples/v0/yoltra-kinetic-logo)**: Suscripciones
  independientes por circulo SVG · [▶ Abrir la demo en vivo](https://yoltra.dev/es/demos/kinetic-logo)
- **[Next.js (Pages Router)](../../examples/v0/yoltra-in-nextjs)**: estado de cliente + cambio de tema · [▶ Abrir la demo en vivo](https://yoltra.dev/es/demos/in-nextjs)

---

## Documentación

- **[README raíz de yoltra](../../README.md)**:
  Descripción general y configuración rápida
- **[API de @yoltra/core](../core/README.md)**:
  Store, middleware, efectos, matchers `When`
- **[Guia de Inicio Rápido](https://github.com/yoltra/yoltra/blob/main/docs/en/QUICK_START_GUIDE.md)**:
  Cinco pasos hacia una app funcional
- **[Comparación de Bibliotecas](https://github.com/yoltra/yoltra/blob/main/docs/en/design/state-management-library-comparison.md)**:
  Comparación arquitectónica

---

## Contribuir

- [Raíz del Monorepo](../../)
- [Guia de Contribución](../../CONTRIBUTING.md)

---

## Estado

**Release Candidate**. Las APIs son estables, usadas en producción, cambios menores posibles
antes de v1.0.0.

---

## Colecciones normalizadas

`useEntityIds`, `useEntity` y `useEntityField` se emparejan con `createEntityAdapter` de
`@yoltra/core`. Son envoltorios delgados sobre `useAtomicProp`; el valor está en que la ruta viene
del adapter en vez de escribirse a mano en un componente, donde nada la verifica.

```tsx
function List() {
  const ids = useEntityIds('todos', todos);
  return <>{ids.map((id) => <Row key={id} id={id} />)}</>;
}

function Row({ id }: { id: string }) {
  // Despierta cuando cambia este titulo, y no cuando cambia el de otra fila.
  const title = useEntityField('todos', todos, id, 'title');
  return <li>{title}</li>;
}
```

## Licencia

**MIT**. Libre para usar en proyectos comerciales y de código abierto.
