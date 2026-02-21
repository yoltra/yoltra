![Yoltra logo](../../assets/yoltra-logo.png)

# Guía de Inicio Rápido

> [🇺🇸 English](../en/QUICK_START_GUIDE.md) &nbsp;|&nbsp; 👉 Español

Cinco pasos desde la instalación hasta una app funcionando.

---

## 1. Instalar

```bash
npm install @yoltra/core @yoltra/react
```

(`@yoltra/react` solo es necesario al usar React.)

---

## 2. Define tu mapa de eventos y tu store

```typescript
// store.ts
import { createStore, eventKeys } from '@yoltra/core';

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

## 3. Crea hooks tipados con `createQuoHooks`

```typescript
// hooks.ts
import { createContext } from 'react';
import { createQuoHooks } from '@yoltra/react';
import type { StoreInstance } from '@yoltra/core';
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

## 4. Provee el store

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

## 5. Usa los hooks en los componentes

```tsx
// Counter.tsx
import { useAtomicProp, useEmit } from './hooks';

export function Counter() {
  // Solo se re-renderiza cuando counter.value cambia
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

## ¿Qué sigue?

- **[API de @yoltra/core](https://github.com/yoltra/yoltra/blob/main/packages/core/README.md)** —
  Middleware, efectos, matchers `When`, suscripciones a eventos
- **[API de @yoltra/react](https://github.com/yoltra/yoltra/blob/main/packages/react/README.md)** —
  `useAtomicProps`, hooks con Suspense, wildcards
- **[Arquitectura de la cola de eventos](./design/event-queue-architecture.md)** —
  Cómo funciona el pipeline internamente
- **[Ejemplos](https://github.com/yoltra/yoltra/blob/main/README.md#live-examples)** —
  App de tareas, logo cinético, integración con Next.js
- **[Guía del Desarrollador](./DEVELOPER_GUIDE.md)** —
  Configurar el monorepo y contribuir
