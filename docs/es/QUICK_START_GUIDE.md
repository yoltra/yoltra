![Quo.js logo](../../assets/logo.svg)

# Guia de Inicio Rapido

> [ 🇲🇽 Versión en Español](https://github.com/quojs/quojs/blob/main/docs/es/QUICK_START_GUIDE.md)&nbsp; |
> &nbsp;[ 🇵🇹 Versão Portuguesa](https://github.com/quojs/quojs/blob/main/docs/pt/QUICK_START_GUIDE.md)&nbsp; |
> &nbsp; 👉 [ 🇺🇸 English Version](https://github.com/quojs/quojs/blob/main/docs/en/QUICK_START_GUIDE.md)&nbsp; |
> &nbsp;[ 🇫🇷 Version française](https://github.com/quojs/quojs/blob/main/docs/fr/QUICK_START_GUIDE.md)

Cinco pasos desde la instalacion hasta una app funcional.

---

## 1. Instalar

```bash
npm install @quojs/core @quojs/react
```

(`@quojs/react` solo es necesario cuando se usa React.)

---

## 2. Definir tu mapa de eventos y store

```typescript
// store.ts
import { createStore, eventKeys } from '@quojs/core';

export type AppEM = {
  counter: {
    increment: number;
    decrement: number;
    reset: null;
  };
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

---

## 3. Crear hooks tipados con `createQuoHooks`

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
  useAtomicProp,
  useEmit,
  useEvent,
  useSelector,
  shallowEqual,
} = createQuoHooks(AppStoreContext);
```

---

## 4. Proveer el store

```tsx
// App.tsx
import { store } from './store';
import { AppStoreContext } from './hooks';

export function App() {
  return (
    <AppStoreContext.Provider value={store}>
      <Counter />
    </AppStoreContext.Provider>
  );
}
```

---

## 5. Usar hooks en componentes

```tsx
// Counter.tsx
import { useAtomicProp, useEmit } from './hooks';

export function Counter() {
  // Solo se re-renderiza cuando counter.value cambia
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
```

---

## Que sigue?

- **[API de @quojs/core](https://github.com/quojs/quojs/blob/main/packages/core/README.md)** -- Middleware, efectos, matchers `When`, suscripciones a eventos
- **[API de @quojs/react](https://github.com/quojs/quojs/blob/main/packages/react/README.md)** -- `useAtomicProps`, hooks de Suspense, wildcards
- **[Arquitectura de Cola de Eventos](https://github.com/quojs/quojs/blob/main/docs/en/design/event-queue-architecture.md)** -- Como funciona el pipeline internamente
- **[Ejemplos](https://github.com/quojs/quojs/blob/main/README.md#live-examples)** -- App de tareas, logo cinetico, integracion con Next.js
