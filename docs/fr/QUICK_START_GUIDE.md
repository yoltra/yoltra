![Quo.js logo](../../assets/logo.svg)

# Guide de demarrage rapide

> [ 🇲🇽 Versión en Español](https://github.com/quojs/quojs/blob/main/docs/es/QUICK_START_GUIDE.md)&nbsp; |
> &nbsp;[ 🇵🇹 Versão Portuguesa](https://github.com/quojs/quojs/blob/main/docs/pt/QUICK_START_GUIDE.md)&nbsp; |
> &nbsp;[ 🇺🇸 English Version](https://github.com/quojs/quojs/blob/main/docs/en/QUICK_START_GUIDE.md)&nbsp; |
> &nbsp; 👉 [ 🇫🇷 Version française](https://github.com/quojs/quojs/blob/main/docs/fr/QUICK_START_GUIDE.md)

Cinq etapes de l'installation a une application fonctionnelle.

---

## 1. Installation

```bash
npm install @quojs/core @quojs/react
```

(`@quojs/react` n'est requis que lors de l'utilisation de React.)

---

## 2. Definissez votre carte d'evenements et votre store

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

## 3. Creez des hooks types avec `createQuoHooks`

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

## 4. Fournissez le store

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

## 5. Utilisez les hooks dans les composants

```tsx
// Counter.tsx
import { useAtomicProp, useEmit } from './hooks';

export function Counter() {
  // Ne se re-rend que lorsque counter.value change
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

## Et ensuite ?

- **[API @quojs/core](https://github.com/quojs/quojs/blob/main/packages/core/README.md)** -- Middleware, effets, matchers `When`, abonnements aux evenements
- **[API @quojs/react](https://github.com/quojs/quojs/blob/main/packages/react/README.md)** -- `useAtomicProps`, hooks Suspense, wildcards
- **[Architecture de la file d'evenements](https://github.com/quojs/quojs/blob/main/docs/en/design/event-queue-architecture.md)** -- Comment le pipeline fonctionne en coulisses
- **[Exemples](https://github.com/quojs/quojs/blob/main/README.md#live-examples)** -- Application de taches, logo cinetique, integration Next.js
