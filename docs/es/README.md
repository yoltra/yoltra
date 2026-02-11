![Quo.js logo](https://quojs.dev/assets/logo.svg)

# Quo.js

> [ 🇲🇽 Versión en Español](https://github.com/quojs/quojs/blob/main/docs/es/README.md)&nbsp; |
> &nbsp;[ 🇵🇹 Versão Portuguesa](https://github.com/quojs/quojs/blob/main/docs/pt/README.md)&nbsp;
> | &nbsp; 👉 [ 🇺🇸 English Version](https://github.com/quojs/quojs/blob/main/README.md)&nbsp; |
> &nbsp;[ 🇫🇷 Version française](https://github.com/quojs/quojs/blob/main/docs/fr/README.md)

![Bundle size](https://img.shields.io/bundlephobia/min/@quojs/core)
![Bundle size](https://img.shields.io/bundlephobia/minzip/@quojs/core)
![npm unpacked size](https://img.shields.io/npm/unpacked-size/@quojs/core)
![npm downloads](https://badgen.net/npm/dm/@quojs/core)
![License](https://img.shields.io/npm/l/@quojs/core)

**Reactividad de grano fino para aplicaciones orientadas a eventos.**

![Kinetic Logo Demo](https://quojs.dev/assets/examples/quojs-dots.gif)

> Mas de 1000 circulos SVG, cada uno suscrito a su propia posicion via `useAtomicProp`. Cada circulo se re-renderiza de forma independiente -- el resto del arbol no se toca. [Ver el codigo fuente de la demo.](https://github.com/quojs/quojs/blob/main/examples/v0/quojs-kinetic-logo/README.md)

---

## La propuesta en 30 segundos

```tsx
import { useAtomicProp, useEmit } from './hooks';

function TodoTitle({ index }: { index: number }) {
  // Se suscribe a items[index].title — se re-renderiza SOLO cuando cambia.
  const title = useAtomicProp({
    reducer: 'todos',
    property: `items.${index}.title`,
  });
  const emit = useEmit();

  return (
    <span onClick={() => emit('todos', 'edit', { index, title: 'New title' })}>
      {title}
    </span>
  );
}
```

Sin selectores. Sin memoizacion. Sin optimizacion manual. La suscripcion *es* la optimizacion.

---

## Por que Quo.js?

### 1. Suscripciones de grano fino con wildcards

Suscribete a `"items.0.title"` o `"items.*.done"` y solo re-renderiza cuando esa ruta exacta cambia. Esto funciona sobre un arbol de estado completo -- incluyendo objetos anidados, arrays y claves dinamicas.

```tsx
// Ruta exacta — re-renderiza cuando items[0].title cambia
const title = useAtomicProp({ reducer: 'todos', property: 'items.0.title' });

// Wildcard — re-renderiza cuando el flag 'done' de CUALQUIER item cambia
const allDone = useAtomicProp(
  { reducer: 'todos', property: 'items.*.done' },
  (state) => state.items.every(i => i.done),
);
```

[Ver la comparacion de flamegraph (Redux vs Quo.js).](https://github.com/quojs/quojs/blob/main/examples/v0/quojs-in-react/redux-quojs-profiler.md)

### 2. Pipeline de eventos estructurado

Los eventos fluyen a traves de un pipeline formal donde cada etapa es interceptable:

```
emit() → dedup → middleware (puede rechazar) → reducers → suscriptores de eventos → efectos → suscriptores gruesos
```

El rechazo por middleware crea **eventos no confirmados** a los que la UI puede reaccionar -- util para autorizacion, validacion y patrones de UI optimista:

```tsx
// Mostrar una advertencia cuando el middleware bloquea un delete
useEvent('ui', 'delete', (event) => {
  showToast('La eliminacion fue bloqueada por permisos');
}, 'uncommitted');
```

### 3. Organizacion de eventos basada en canales

Los eventos son tuplas `(channel, type, payload)` -- namespacing natural que escala sin colisiones:

```typescript
await emit('auth', 'login', credentials);
await emit('analytics', 'track', event);
await emit('ui', 'toast', { message: 'Saved!' });
```
---

## Paquetes

| Paquete | Descripcion |
|---------|-------------|
| **[@quojs/core](https://github.com/quojs/quojs/blob/main/packages/core/README.md)** | Store agnostico de framework, reducers, middleware, efectos |
| **[@quojs/react](https://github.com/quojs/quojs/blob/main/packages/react/README.md)** | Hooks de React con suscripciones de grano fino y soporte para Suspense |

---

## Configuracion Rapida (React)

### 1. Instalar

```bash
npm install @quojs/core @quojs/react
```

### 2. Definir tu mapa de eventos

```typescript
// types.ts
export type AppEM = {
  todos: {
    add: { id: string; title: string };
    toggle: { id: string };
    delete: { id: string };
  };
};
```

### 3. Crear el store

```typescript
// store.ts
import { createStore, eventKeys } from '@quojs/core';
import type { AppEM } from './types';

export type AppState = {
  todos: { items: Array<{ id: string; title: string; done: boolean }> };
};

export const store = createStore<AppState, AppEM>({
  name: 'App',
  reducer: {
    todos: {
      state: { items: [] },
      when: { keys: eventKeys<AppEM>()([
        ['todos', 'add'],
        ['todos', 'toggle'],
        ['todos', 'delete'],
      ])},
      reducer: (state, event) => {
        switch (event.type) {
          case 'add':
            return { items: [...state.items, { ...event.payload, done: false }] };
          case 'toggle':
            return {
              items: state.items.map(i =>
                i.id === event.payload.id ? { ...i, done: !i.done } : i
              ),
            };
          case 'delete':
            return { items: state.items.filter(i => i.id !== event.payload.id) };
          default:
            return state;
        }
      },
    },
  },
});
```

### 4. Crear hooks tipados con `createQuoHooks`

```typescript
// hooks.ts
import { createContext } from 'react';
import { createQuoHooks } from '@quojs/react';
import type { StoreInstance } from '@quojs/core';
import type { AppState, AppEM } from './types';

export const AppStoreContext = createContext<
  StoreInstance<'todos', AppState, AppEM> | null
>(null);

export const {
  useAtomicProp,
  useAtomicProps,
  useEmit,
  useEvent,
  useSelector,
  shallowEqual,
} = createQuoHooks(AppStoreContext);
```

### 5. Proveer y usar

```tsx
// App.tsx
import { StoreProvider } from '@quojs/react';
import { store } from './store';
import { AppStoreContext } from './hooks';

export function App() {
  return (
    <AppStoreContext.Provider value={store}>
      <TodoList />
    </AppStoreContext.Provider>
  );
}
```

---

## Ejemplos en Vivo

| Ejemplo | Descripcion |
|---------|-------------|
| **[Logo Cinetico (1000+ particulas)](https://github.com/quojs/quojs/blob/main/examples/v0/quojs-kinetic-logo/README.md)** | Simulacion de fisica con suscripciones de ruta independientes por circulo |
| **[App de Tareas con Profiler](https://github.com/quojs/quojs/blob/main/examples/v0/quojs-in-react/README.md)** | Comparacion de flamegraph lado a lado con Redux ([resultados del profiler](https://github.com/quojs/quojs/blob/main/examples/v0/quojs-in-react/redux-quojs-profiler.md)) |
| **[Next.js 15 App Router](https://github.com/quojs/quojs/blob/main/examples/v0/quojs-in-nextjs/README.md)** | Compatibilidad SSR + App Router con cambio de tema |

---

## Documentacion

- **[Guia de Inicio Rapido](https://github.com/quojs/quojs/blob/main/docs/en/QUICK_START_GUIDE.md)** -- Cinco pasos hacia una app funcional
- **[API de @quojs/core](https://github.com/quojs/quojs/blob/main/packages/core/README.md)** -- Store, middleware, efectos, matchers `When`
- **[API de @quojs/react](https://github.com/quojs/quojs/blob/main/packages/react/README.md)** -- Hooks, Suspense, `createQuoHooks`
- **[Arquitectura de Cola de Eventos](https://github.com/quojs/quojs/blob/main/docs/en/design/event-queue-architecture.md)** -- Inmersion tecnica profunda en el pipeline
- **[Comparacion de Bibliotecas](https://github.com/quojs/quojs/blob/main/docs/en/design/state-management-library-comparison.md)** -- Comparacion arquitectonica con Redux, Zustand, Jotai y otras

---

## Contribuir

Damos la bienvenida a las contribuciones! Por favor lee:

- [Guia de Contribucion](https://github.com/quojs/quojs/blob/main/CONTRIBUTING.md)
- [Codigo de Conducta](https://github.com/quojs/quojs/blob/main/CODE_OF_CONDUCT.md)
- [Gobernanza](https://github.com/quojs/quojs/blob/main/GOVERNANCE.md)
- [Mantenedores](https://github.com/quojs/quojs/blob/main/MAINTAINERS.md)
- [Politica de Seguridad](https://github.com/quojs/quojs/blob/main/SECURITY.md)

---

## Desarrollo (Monorepo)

```bash
npm i -g @microsoft/rush
rush install
rush build
rush test
```

Consulta la **[Guia del Desarrollador](https://github.com/quojs/quojs/blob/main/docs/en/DEVELOPER_GUIDE.md)** para mas detalles.

---

## Estado

Quo.js esta en etapa de **Release Candidate** (v0.7.0+):
- Las APIs son estables y se usan en aplicaciones en produccion
- Los tipos de TypeScript son estrictos y completos
- Las APIs menores aun pueden evolucionar antes de v1.0

Los comentarios y PRs son bienvenidos.

---

## Licencia

**MIT** -- Libre para usar en proyectos comerciales y de codigo abierto.

Consulta [LICENSE](https://github.com/quojs/quojs/blob/main/LICENSE) para mas detalles.

---

## Comunidad
- **Sitio web:** [quojs.dev](https://quojs.dev)
- **Twitter/X:** [@quojs_dev](https://twitter.com/quojs_dev)
- **GitHub Discussions:** [Unete a la conversacion](https://github.com/quojs/quojs/discussions)
- **Issues:** [Reporta errores o solicita funcionalidades](https://github.com/quojs/quojs/issues)
