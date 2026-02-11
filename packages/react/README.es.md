# @quojs/react

> 👉 [ 🇲🇽 Versión en Español](./README.es.md)&nbsp; |
> &nbsp;[ 🇵🇹 Versão Portuguesa](./README.pt.md)&nbsp; | &nbsp;
> [ 🇺🇸 English Version](./README.md)&nbsp; | &nbsp;[ 🇫🇷 Version française](./README.fr.md)

![Bundle size](https://badgen.net/bundlephobia/min/@quojs/react)
![Bundle size](https://badgen.net/bundlephobia/minzip/@quojs/react)
![Bundle size](https://badgen.net/bundlephobia/tree-shaking/@quojs/react)
![Bundle size](https://badgen.net/bundlephobia/dependency-count/@quojs/react)
![npm version](https://badgen.net/npm/v/@quojs/react)
![npm downloads](https://badgen.net/npm/dm/@quojs/react)
![License](https://badgen.net/npm/license/@quojs/react)

**Hooks de React para [Quo.js](https://github.com/quojs/quojs/blob/main/README.md) con suscripciones de grano fino por ruta.**

Suscribete a `"items.0.title"` o `"items.*.done"` -- el componente se re-renderiza solo cuando esa ruta exacta cambia. Sin selectores, sin memoizacion, sin optimizacion manual.

[Ver la comparacion de flamegraph (Redux vs Quo.js).](https://github.com/quojs/quojs/blob/main/examples/v0/quojs-in-react/redux-quojs-profiler.md)

---

## Instalacion

```bash
npm install @quojs/core @quojs/react
```

**Dependencias peer:** React 18+

---

## Configuracion con `createQuoHooks` (recomendado)

`createQuoHooks` vincula hooks completamente tipados al contexto de tu store. Todos los parametros de tipo se infieren -- no se necesitan generics explicitos en los componentes.

### 1. Definir tipos y store

```typescript
// store.ts
import { createStore, eventKeys } from '@quojs/core';

export type AppEM = {
  counter: { increment: number; decrement: number; reset: null };
};

export type AppState = { counter: { value: number } };

export const store = createStore<AppState, AppEM>({
  name: 'App',
  reducer: {
    counter: {
      state: { value: 0 },
      when: { keys: eventKeys<AppEM>()([
        ['counter', 'increment'],
        ['counter', 'decrement'],
        ['counter', 'reset'],
      ])},
      reducer: (state, event) => {
        switch (event.type) {
          case 'increment': return { value: state.value + event.payload };
          case 'decrement': return { value: state.value - event.payload };
          case 'reset':     return { value: 0 };
          default:          return state;
        }
      },
    },
  },
});
```

### 2. Crear hooks tipados

```typescript
// hooks.ts
import { createContext } from 'react';
import { createQuoHooks } from '@quojs/react';
import type { StoreInstance } from '@quojs/core';
import type { AppState, AppEM } from './store';

export const AppStoreContext = createContext<
  StoreInstance<'counter', AppState, AppEM> | null
>(null);

export const {
  useStore,
  useEmit,
  useSelector,
  useAtomicProp,
  useAtomicProps,
  useEvent,
  shallowEqual,
} = createQuoHooks(AppStoreContext);
```

### 3. Proveer y usar

```tsx
// App.tsx
import { store } from './store';
import { AppStoreContext, useAtomicProp, useEmit } from './hooks';

function Counter() {
  const value = useAtomicProp({ reducer: 'counter', property: 'value' });
  const emit = useEmit();

  return (
    <div>
      <h1>Count: {value}</h1>
      <button onClick={() => emit('counter', 'increment', 1)}>+</button>
      <button onClick={() => emit('counter', 'decrement', 1)}>-</button>
      <button onClick={() => emit('counter', 'reset', null)}>Reset</button>
    </div>
  );
}

export function App() {
  return (
    <AppStoreContext.Provider value={store}>
      <Counter />
    </AppStoreContext.Provider>
  );
}
```

---

## API de Hooks

### `useAtomicProp({ reducer, property }, map?, isEqual?)`

Selector de ruta unica con grano fino. Se re-renderiza solo cuando la ruta especificada cambia.

```tsx
// Ruta exacta — se re-renderiza cuando items[0].title cambia
const title = useAtomicProp({
  reducer: 'todos',
  property: 'items.0.title',
});

// Con mapper — derivar un valor de la ruta
const count = useAtomicProp(
  { reducer: 'todos', property: 'items' },
  (items) => items.length,
);

// Patron wildcard — se re-renderiza cuando cualquier item cambia
const allTitles = useAtomicProp(
  { reducer: 'todos', property: 'items.**' },
  (state) => state.items.map(t => t.title),
  shallowEqual,
);
```

**Patrones soportados:**
- `"items.0.title"` -- ruta exacta (incluyendo indices numericos de array)
- `"items.*.title"` -- `*` coincide con un segmento
- `"items.**"` -- `**` coincide con cero o mas segmentos

---

### `useAtomicProps(specs, selector, isEqual?)`

Selector de multiples rutas. Se suscribe a varias rutas y recalcula cuando alguna cambia.

```tsx
const filtered = useAtomicProps(
  [
    { reducer: 'todos', property: 'items.**' },
    { reducer: 'filter', property: 'q' },
  ],
  (state) => state.todos.items.filter(
    item => item.title.includes(state.filter.q)
  ),
  shallowEqual,
);
```

---

### `useEvent(channel, type, handler, phase?)`

Suscribete a eventos del store desde un componente. No afecta el flujo de eventos -- fire-and-forget.

```tsx
// Eventos confirmados (por defecto) — eventos que pasaron el middleware
useEvent('ui', 'save', (event) => {
  showToast('Saved!');
});

// Eventos no confirmados — eventos rechazados por el middleware
useEvent('ui', 'delete', (event) => {
  showToast('Delete was blocked by permissions');
}, 'uncommitted');

// Todos los eventos — distinguir por fase
useEvent('ui', 'action', (event, getState, emit, phase) => {
  console.log(`Action ${phase}:`, event.type);
}, 'all');
```

**Fases:**
- `'committed'` (por defecto) -- eventos que pasaron el middleware y llegaron a los reducers
- `'uncommitted'` -- eventos rechazados por el middleware
- `'all'` -- ambos, con parametro `phase` para distinguir

---

### `useEmit()`

Retorna la funcion `emit` tipada del store (referencia estable).

```tsx
const emit = useEmit();
await emit('counter', 'increment', 1);
```

---

### `useSelector(selector, isEqual?)`

Selector de grano grueso via `useSyncExternalStore`. Se re-renderiza cuando el valor seleccionado cambia.

```tsx
const count = useSelector((state) => state.counter.value);
```

---

### `useStore()`

Retorna la instancia del store. Lanza error si se llama fuera de un provider.

```tsx
const store = useStore();
const state = store.getState();
```

---

## Hooks de Suspense

### `useSuspenseAtomicProp(spec, options)`

Version compatible con Suspense de `useAtomicProp`. Lanza una promesa mientras carga, capturada por el boundary `<Suspense>` mas cercano.

```tsx
function UserName({ userId }: { userId: string }) {
  const name = useSuspenseAtomicProp(
    { reducer: 'users', property: `byId.${userId}.name` },
    {
      load: async (name, slice) => name ?? (await fetchUser(userId)).name,
      staleTime: 30_000,
    },
  );
  return <span>{name}</span>;
}

// Uso
<Suspense fallback={<Spinner />}>
  <UserName userId="123" />
</Suspense>
```

### `useSuspenseAtomicProps(specs, options)`

Selector Suspense de multiples rutas.

```tsx
const stats = useSuspenseAtomicProps(
  [
    { reducer: 'orders', property: 'items.**' },
    { reducer: 'users', property: 'active' },
  ],
  { load: async (state) => computeDashboardStats(state) },
);
```

### Utilidades de cache

```typescript
import {
  invalidateAtomicProp,
  invalidateAtomicPropsByReducer,
  clearSuspenseCache,
} from '@quojs/react';

// Invalidar cache de una ruta especifica
invalidateAtomicProp('users', 'byId.123.name');

// Invalidar todas las entradas de cache de un reducer
invalidateAtomicPropsByReducer('users');

// Limpiar todo
clearSuspenseCache();
```

---

## `shallowEqual`

Comparador de igualdad superficial de objetos. Usalo como argumento `isEqual` cuando tu valor derivado es un objeto plano:

```tsx
const todos = useAtomicProp(
  { reducer: 'todos', property: 'items.**' },
  (state) => state.items.map(t => ({ id: t.id, title: t.title })),
  shallowEqual,
);
```

---

## Rendimiento: Antes y Despues

### Antes (grano grueso)

```tsx
// Cada TodoItem se re-renderiza cuando CUALQUIER tarea cambia
function TodoList() {
  const todos = useSelector(state => state.todos.items);
  return todos.map(todo => <TodoItem key={todo.id} todo={todo} />);
}
```

### Despues (grano fino con Quo.js)

```tsx
// Cada TodoItem se re-renderiza SOLO cuando sus propios datos cambian
function TodoItem({ index }: { index: number }) {
  const title = useAtomicProp({
    reducer: 'todos',
    property: `items.${index}.title`,
  });
  const done = useAtomicProp({
    reducer: 'todos',
    property: `items.${index}.done`,
  });
  return <div className={done ? 'done' : ''}>{title}</div>;
}
```

[Ver la comparacion completa de flamegraph.](https://github.com/quojs/quojs/blob/main/examples/v0/quojs-in-react/redux-quojs-profiler.md)

---

## Compatibilidad con React 18+

- **Concurrent Mode:** Totalmente compatible. Todos los hooks usan `useSyncExternalStore`.
- **Strict Mode:** La deduplicacion de eventos previene el doble procesamiento.
- **Suspense:** `useSuspenseAtomicProp` y `useSuspenseAtomicProps` lanzan promesas para boundaries `<Suspense>`.

---

## Ejemplos

- **[App de Tareas con Profiler](../../examples/v0/quojs-in-react)** -- CRUD completo con comparacion de flamegraph
- **[Logo Cinetico (1000+ particulas)](../../examples/v0/quojs-kinetic-logo)** -- Suscripciones independientes por circulo SVG
- **[Next.js 15 App Router](../../examples/v0/quojs-in-nextjs)** -- SSR + cambio de tema

---

## Documentacion

- **[README raiz de Quo.js](https://github.com/quojs/quojs/blob/main/README.md)** -- Descripcion general y configuracion rapida
- **[API de @quojs/core](https://github.com/quojs/quojs/blob/main/packages/core/README.md)** -- Store, middleware, efectos, matchers `When`
- **[Guia de Inicio Rapido](https://github.com/quojs/quojs/blob/main/docs/en/QUICK_START_GUIDE.md)** -- Cinco pasos hacia una app funcional
- **[Comparacion de Bibliotecas](https://github.com/quojs/quojs/blob/main/docs/en/design/state-management-library-comparison.md)** -- Comparacion arquitectonica

---

## Contribuir

- [Raiz del Monorepo](../../)
- [Guia de Contribucion](../../CONTRIBUTING.md)

---

## Estado

**Release Candidate (v0.7.0+)** -- Las APIs son estables, usadas en produccion, cambios menores posibles antes de v1.0.

---

## Licencia

**MIT** -- Libre para usar en proyectos comerciales y de codigo abierto.
