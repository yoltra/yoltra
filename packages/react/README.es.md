# @quojs/react — Bindings de React para Quo.js

> 👉 [ 🇲🇽 Versión en Español](./README.es.md)&nbsp; |
> &nbsp;[ 🇵🇹 Versão Portuguesa](./README.pt.md)&nbsp; |
> &nbsp;[ 🇺🇸 English Version](./README.md)&nbsp; | &nbsp;[ 🇫🇷 Version française](./README.fr.md)

![Tamaño del bundle](https://badgen.net/bundlephobia/min/@quojs/react)
![Tamaño del bundle](https://badgen.net/bundlephobia/minzip/@quojs/react)
![Tamaño del bundle](https://badgen.net/bundlephobia/tree-shaking/@quojs/react)
![Tamaño del bundle](https://badgen.net/bundlephobia/dependency-count/@quojs/react)
![Versión npm](https://badgen.net/npm/v/@quojs/react)
![Descargas npm](https://badgen.net/npm/dm/@quojs/react)
![Licencia](https://badgen.net/npm/license/@quojs/react)

**Bindings de React para Quo.js con suscripciones atómicas.**

`@quojs/react` proporciona hooks y componentes de React para Quo.js, con **control de re-renderizado de grano fino**, **soporte para Suspense** y **compatibilidad con Concurrent Mode**.

**Cero re-renderizados innecesarios por defecto.**

---

## ¿Qué es @quojs/react?

Compañero oficial de React para **[@quojs/core](https://github.com/quojs/quojs/blob/main/packages/core/README.es.md)**—un contenedor de estado basado en eventos con:

- **Suscripciones atómicas** — Suscríbete a rutas de estado exactas, solo re-renderiza cuando estas cambian
- **Soporte nativo para async** — Middleware y effects integrados, sin thunks/sagas
- **Eventos basados en canales** — Organiza eventos por canal para prevenir colisiones de nombres
- **Garantías de inmutabilidad** — Aplicación de deep-freeze con detección precisa de cambios

---

## Características Principales

- 🎯 **Suscripciones Atómicas** — `useAtomicProp` se suscribe a rutas exactas (`'todos.items.0.title'`)
- ⚡ **Cero Renderizados Desperdiciados** — Solo re-renderiza cuando las rutas suscritas realmente cambian
- 🔮 **Listo para Suspense** — `useSuspenseAtomicProp` para patrones de obtención de datos
- 🧩 **Concurrent Mode** — Totalmente compatible con las características concurrentes de React 18+
- 🛡️ **TypeScript-First** — Excelente inferencia de tipos y autocompletado
- 📌 **Ligero** — ~7KB (minificado + gzipped)

---

## Instalación

```bash
npm install @quojs/core @quojs/react
# o
yarn add @quojs/core @quojs/react
# o
pnpm add @quojs/core @quojs/react
```

**Dependencias peer:** React 18+ (probado con React 18 y 19)

---

## Inicio Rápido

### 1. Crea Tu Store

```typescript
// store.ts
import { createStore } from '@quojs/core';

export type AppEM = {
  counter: {
    increment: number;
    decrement: number;
    reset: null;
  };
};

export const store = createStore({
  name: 'Quo.js Store',
  reducer: {
    counter: {
      state: { value: 0 },
      events: [
        ['counter', 'increment'],
        ['counter', 'decrement'],
        ['counter', 'reset']
      ],
      reducer: (state, event) => {
        switch (event.type) {
          case 'increment':
            return { value: state.value + event.payload };
          case 'decrement':
            return { value: state.value - event.payload };
          case 'reset':
            return { value: 0 };
          default:
            return state;
        }
      }
    }
  }
});

export type AppStore = typeof store;
```

### 2. Crea el Contexto del Store

```typescript
// StoreContext.ts
import { createContext } from 'react';
import type { AppStore } from './store';

export const StoreContext = createContext<AppStore | null>(null);
```

### 3. Crea Hooks Tipados

```typescript
// hooks.ts
import { createQuoHooks } from '@quojs/react';
import { StoreContext } from './StoreContext';
import type { AppEM } from './store';

export const {
  useStore,
  useEmit,
  useSelector,
  useAtomicProp,
  useAtomicProps,
  shallowEqual,
} = createQuoHooks<'counter', AppState, AppEM>(StoreContext);
```

### 4. Proporciona el Store

```tsx
// App.tsx
import { StoreProvider } from '@quojs/react';
import { store } from './store';
import { Counter } from './Counter';

export function App() {
  return (
    <StoreProvider store={store}>
      <Counter />
    </StoreProvider>
  );
}
```

### 5. Usa Hooks en Componentes

```tsx
// Counter.tsx
import { useAtomicProp, useEmit } from './hooks';

export function Counter() {
  // Solo re-renderiza cuando counter.value cambia
  const value = useAtomicProp({ reducer: 'counter', property: 'value' });
  const emit = useEmit();

  return (
    <div>
      <h1>Contador: {value}</h1>
      <button onClick={() => emit('counter', 'increment', 1)}>+</button>
      <button onClick={() => emit('counter', 'decrement', 1)}>-</button>
      <button onClick={() => emit('counter', 'reset', null)}>Reiniciar</button>
    </div>
  );
}
```

---

## Referencia de API

### Componentes

#### `<StoreProvider>`

Proporciona el store de Quo.js a los componentes de React a través del contexto.

```tsx
import { StoreProvider } from '@quojs/react';
import { store } from './store';

function App() {
  return (
    <StoreProvider store={store}>
      <YourApp />
    </StoreProvider>
  );
}
```

---

### Hooks

#### `useStore()`

Devuelve la instancia del store.

```tsx
const store = useStore();
const state = store.getState();
```

---

#### `useEmit()`

Devuelve la función `emit` tipada.

```tsx
const emit = useEmit();

// Emite eventos (completamente tipado)
await emit('counter', 'increment', 1);
await emit('todos', 'add', { id: '1', title: 'Comprar leche' });
```

**Reemplaza:** `useDispatch()` (eliminado en v0.5.0+)

---

#### `useSelector(selector, isEqual?)`

Selecciona estado derivado mediante una función selectora.

```tsx
const count = useSelector((state) => state.counter.value);

// Con igualdad personalizada
import { shallowEqual } from './hooks';

const todos = useSelector(
  (state) => state.todos.items,
  shallowEqual
);
```

**Re-renderiza:** Cuando el valor seleccionado cambia (según `isEqual`)

---

#### `useAtomicProp({ reducer, property })`

**La característica estrella.** Se suscribe a una ruta de estado específica—solo re-renderiza cuando esa ruta exacta cambia.

```tsx
// Solo re-renderiza cuando items[0].title cambia
const title = useAtomicProp({ 
  reducer: 'todos', 
  property: 'items.0.title' 
});

// Con función mapper
const count = useAtomicProp(
  { reducer: 'todos', property: 'items' },
  (items) => items.length
);

// Patrones wildcard
const allTitles = useAtomicProp(
  { reducer: 'todos', property: 'items.*.title' },
  (state) => state.items.map(t => t.title)
);
```

**Beneficios:**
- ✅ Cero re-renderizados innecesarios
- ✅ No requiere optimización manual
- ✅ Funciona con rutas profundas y wildcards

---

#### `useAtomicProps(specs, selector, isEqual?)`

Se suscribe a múltiples rutas, re-calcula el selector cuando alguna cambia.

```tsx
const filtered = useAtomicProps(
  [
    { reducer: 'todos', property: 'items.**' },
    { reducer: 'todos', property: 'filter' }
  ],
  (state) => {
    return state.todos.items.filter(
      item => item.status === state.todos.filter
    );
  },
  shallowEqual
);
```

**Caso de uso:** Estado derivado que depende de múltiples slices

---

#### `useSuspenseAtomicProp({ reducer, property }, options)`

Versión habilitada para Suspense de `useAtomicProp`.

```tsx
const user = useSuspenseAtomicProp(
  { reducer: 'user', property: 'profile' },
  {
    load: async (profile) => {
      if (!profile) {
        const res = await fetch('/api/user');
        return res.json();
      }
      return profile;
    },
    staleTime: 60000, // 1 minuto
  }
);

// El componente se suspende mientras carga
```

**Características:**
- Gestión automática de caché
- Tiempo de obsolescencia configurable
- Funciona con límites de `<Suspense>`

---

#### `useSuspenseAtomicProps(specs, options)`

Versión habilitada para Suspense de `useAtomicProps`.

```tsx
const data = useSuspenseAtomicProps(
  [
    { reducer: 'user', property: 'id' },
    { reducer: 'posts', property: 'list' }
  ],
  {
    load: async (state) => {
      const res = await fetch(`/api/posts?user=${state.user.id}`);
      return res.json();
    }
  }
);
```

---

### Utilidades de Suspense

#### `invalidateAtomicProp(reducer, property, key?)`

Invalida la caché para una propiedad específica.

```tsx
import { invalidateAtomicProp } from '@quojs/react';

// Después de una mutación
await emit('user', 'update', newData);
invalidateAtomicProp('user', 'profile');
```

---

#### `invalidateAtomicPropsByReducer(reducer)`

Invalida todas las entradas de caché para un reducer.

```tsx
import { invalidateAtomicPropsByReducer } from '@quojs/react';

invalidateAtomicPropsByReducer('todos');
```

---

#### `clearSuspenseCache()`

Limpia toda la caché de Suspense.

```tsx
import { clearSuspenseCache } from '@quojs/react';

clearSuspenseCache();
```

---

## Comparación de Rendimiento

### Redux / Zustand (Grano grueso)

```tsx
// ❌ Re-renderiza cuando CUALQUIER tarea cambia
const todos = useSelector(state => state.todos.items);

return <div>{todos.map(todo => ...)}</div>;
```

**Problema:** Todo el árbol de componentes se re-renderiza en cada cambio de tarea.

### Quo.js (Grano fino)

```tsx
// ✅ Solo re-renderiza cuando ESTA tarea específica cambia
function TodoItem({ id }) {
  const title = useAtomicProp({ 
    reducer: 'todos', 
    property: `items.${id}.title` 
  });
  
  return <div>{title}</div>;
}
```

**Resultado:** Cero renderizados desperdiciados.

[Ver comparación de flamegraph →](https://github.com/quojs/quojs/blob/main/examples/v0/quojs-in-react/redux-quojs-profiler.es.md)

---

## Soporte para TypeScript

Los hooks de Quo.js React están completamente tipados:

```typescript
type AppEM = {
  todos: {
    add: { id: string; title: string };
    toggle: { id: string };
  };
};

const emit = useEmit<AppEM>();

// ✅ El autocompletado funciona
await emit('todos', 'add', { 
  id: '1',
  title: 'Comprar leche'
});

// ❌ TypeScript detecta errores
await emit('todos', 'add', { id: 1 }); // Error: id debe ser string
await emit('invalid', 'event', null);  // Error: Canal desconocido
```

---

## Características de React 18+

### Concurrent Mode

Quo.js es totalmente compatible con el renderizado concurrente de React 18:

```tsx
import { startTransition } from 'react';

function Search() {
  const emit = useEmit();
  
  const handleSearch = (query) => {
    startTransition(() => {
      emit('search', 'query', query);
    });
  };
  
  return <input onChange={(e) => handleSearch(e.target.value)} />;
}
```

### Suspense

```tsx
import { Suspense } from 'react';

function App() {
  return (
    <Suspense fallback={<Loading />}>
      <UserProfile />
    </Suspense>
  );
}

function UserProfile() {
  const user = useSuspenseAtomicProp(
    { reducer: 'user', property: 'profile' },
    {
      load: async () => {
        const res = await fetch('/api/user');
        return res.json();
      }
    }
  );
  
  return <div>Bienvenido, {user.name}!</div>;
}
```

---

## Migración desde v0.4.x

### Cambios de Nombres de Hooks (v0.5.0+)

| Antiguo (v0.4.x)  | Nuevo (v0.5.0+)    | Estado                                  |
|-------------------|--------------------|-----------------------------------------|
| `useDispatch()`   | `useEmit()`        | ❌ Eliminado (usar `useEmit()`)         |
| `useSliceProp()`  | `useAtomicProp()`  | ❌ Eliminado (usar `useAtomicProp()`)   |
| `useSliceProps()` | `useAtomicProps()` | ❌ Eliminado (usar `useAtomicProps()`)  |

### Ejemplo de Migración

```tsx
// ANTES (v0.4.x)
import { useDispatch, useSliceProp } from '@quojs/react';

function Counter() {
  const value = useSliceProp({ reducer: 'counter', property: 'value' });
  const dispatch = useDispatch();

  return (
    <button onClick={() => dispatch('counter', 'increment', 1)}>
      {value}
    </button>
  );
}

// DESPUÉS (v0.5.0+)
import { useEmit, useAtomicProp } from '@quojs/react';

function Counter() {
  const value = useAtomicProp({ reducer: 'counter', property: 'value' });
  const emit = useEmit();

  return (
    <button onClick={() => emit('counter', 'increment', 1)}>
      {value}
    </button>
  );
}
```

**Nota:** Todos los hooks deprecados han sido eliminados. Si estás actualizando desde v0.4.x, debes actualizar tu código para usar los nuevos nombres de hooks.

---

## Ejemplos

- **[Aplicación de Tareas](../../examples/v0/quojs-in-react/README.es.md)** — CRUD completo con perfilado de rendimiento
- **[Logo Cinético](../../examples/v0/quojs-kinetic-logo/README.es.md)** — 900 círculos SVG + simulación de física
- **[Next.js 15](../../examples/v0/quojs-in-nextjs/README.es.md)** — SSR + cambiador de tema

---

## Documentación

- **[Guía de Inicio Rápido](https://quojs.dev)** — Comienza en 5 minutos
- **[Referencia de API TypeDoc](./docs/README.md)** — Documentación completa de la API
- **[Comparación de Bibliotecas](../../docs/es/design/state-management-library-comparison.md)** — vs Redux, Zustand, Jotai, etc.

---

## Contribuir

Ver:
- [Raíz del Monorepo](../../docs/es/README.md)
- [Guía de Contribución](../../docs/es/CONTRIBUTING.md)
- [Código de Conducta](../../docs/es/CODE_OF_CONDUCT.md)

---

## Estado

**Release Candidate** — Las APIs son estables, usadas en producción, cambios menores posibles antes de v1.0.

---

## Licencia

**MIT** — Libre para usar en proyectos comerciales y de código abierto.

---

Hecho en 🇲🇽 para el mundo.