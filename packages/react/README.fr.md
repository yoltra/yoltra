# @quojs/react

> [ 🇲🇽 Versión en Español](./README.es.md)&nbsp; |
> &nbsp;[ 🇵🇹 Versão Portuguesa](./README.pt.md)&nbsp; |
> &nbsp;[ 🇺🇸 English Version](./README.md)&nbsp; | &nbsp; 👉
> [ 🇫🇷 Version française](./README.fr.md)

![Taille du bundle](https://badgen.net/bundlephobia/min/@quojs/react)
![Taille du bundle](https://badgen.net/bundlephobia/minzip/@quojs/react)
![Taille du bundle](https://badgen.net/bundlephobia/tree-shaking/@quojs/react)
![Taille du bundle](https://badgen.net/bundlephobia/dependency-count/@quojs/react)
![Version npm](https://badgen.net/npm/v/@quojs/react)
![Telechargements npm](https://badgen.net/npm/dm/@quojs/react)
![Licence](https://badgen.net/npm/license/@quojs/react)

**Hooks React pour [Quo.js](https://github.com/quojs/quojs/blob/main/README.md) avec abonnements fins aux chemins.**

Abonnez-vous a `"items.0.title"` ou `"items.*.done"` -- le composant ne se re-rend que lorsque ce chemin exact change. Pas de selecteurs, pas de memoisation, pas d'optimisation manuelle.

[Voir la comparaison des flamegraphs (Redux vs Quo.js).](https://github.com/quojs/quojs/blob/main/examples/v0/quojs-in-react/redux-quojs-profiler.md)

---

## Installation

```bash
npm install @quojs/core @quojs/react
```

**Dependances peer :** React 18+

---

## Configuration avec `createQuoHooks` (recommande)

`createQuoHooks` lie des hooks entierement types au contexte de votre store. Tous les parametres de type sont inferes -- pas besoin de generiques explicites dans les composants.

### 1. Definissez les types et le store

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

### 2. Creez des hooks types

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

### 3. Fournissez et utilisez

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

## API des hooks

### `useAtomicProp({ reducer, property }, map?, isEqual?)`

Selecteur fin sur un seul chemin. Ne se re-rend que lorsque le chemin specifie change.

```tsx
// Chemin exact -- se re-rend lorsque items[0].title change
const title = useAtomicProp({
  reducer: 'todos',
  property: 'items.0.title',
});

// Avec mapper -- deriver une valeur depuis le chemin
const count = useAtomicProp(
  { reducer: 'todos', property: 'items' },
  (items) => items.length,
);

// Pattern wildcard -- se re-rend lorsque n'importe quel element change
const allTitles = useAtomicProp(
  { reducer: 'todos', property: 'items.**' },
  (state) => state.items.map(t => t.title),
  shallowEqual,
);
```

**Patterns supportes :**
- `"items.0.title"` -- chemin exact (y compris les indices de tableau numeriques)
- `"items.*.title"` -- `*` correspond a un segment
- `"items.**"` -- `**` correspond a zero ou plusieurs segments

---

### `useAtomicProps(specs, selector, isEqual?)`

Selecteur multi-chemins. S'abonne a plusieurs chemins et recalcule lorsqu'un chemin change.

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

S'abonne aux evenements du store depuis un composant. N'affecte pas le flux d'evenements -- fire-and-forget.

```tsx
// Evenements confirmes (par defaut) -- evenements ayant passe le middleware
useEvent('ui', 'save', (event) => {
  showToast('Saved!');
});

// Evenements non confirmes -- evenements rejetes par le middleware
useEvent('ui', 'delete', (event) => {
  showToast('Delete was blocked by permissions');
}, 'uncommitted');

// Tous les evenements -- distinguer par phase
useEvent('ui', 'action', (event, getState, emit, phase) => {
  console.log(`Action ${phase}:`, event.type);
}, 'all');
```

**Phases :**
- `'committed'` (par defaut) -- evenements ayant passe le middleware et atteint les reducers
- `'uncommitted'` -- evenements rejetes par le middleware
- `'all'` -- les deux, avec le parametre `phase` pour distinguer

---

### `useEmit()`

Retourne la fonction `emit` typee du store (reference stable).

```tsx
const emit = useEmit();
await emit('counter', 'increment', 1);
```

---

### `useSelector(selector, isEqual?)`

Selecteur a granularite grossiere via `useSyncExternalStore`. Se re-rend lorsque la valeur selectionnee change.

```tsx
const count = useSelector((state) => state.counter.value);
```

---

### `useStore()`

Retourne l'instance du store. Leve une erreur si appele en dehors d'un provider.

```tsx
const store = useStore();
const state = store.getState();
```

---

## Hooks Suspense

### `useSuspenseAtomicProp(spec, options)`

Version compatible Suspense de `useAtomicProp`. Lance une promesse pendant le chargement, capturee par la limite `<Suspense>` la plus proche.

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

// Utilisation
<Suspense fallback={<Spinner />}>
  <UserName userId="123" />
</Suspense>
```

### `useSuspenseAtomicProps(specs, options)`

Selecteur Suspense multi-chemins.

```tsx
const stats = useSuspenseAtomicProps(
  [
    { reducer: 'orders', property: 'items.**' },
    { reducer: 'users', property: 'active' },
  ],
  { load: async (state) => computeDashboardStats(state) },
);
```

### Utilitaires de cache

```typescript
import {
  invalidateAtomicProp,
  invalidateAtomicPropsByReducer,
  clearSuspenseCache,
} from '@quojs/react';

// Invalider le cache d'un chemin specifique
invalidateAtomicProp('users', 'byId.123.name');

// Invalider toutes les entrees de cache pour un reducer
invalidateAtomicPropsByReducer('users');

// Tout effacer
clearSuspenseCache();
```

---

## `shallowEqual`

Comparateur d'egalite superficielle d'objets. Utilisez-le comme argument `isEqual` lorsque votre valeur derivee est un objet simple :

```tsx
const todos = useAtomicProp(
  { reducer: 'todos', property: 'items.**' },
  (state) => state.items.map(t => ({ id: t.id, title: t.title })),
  shallowEqual,
);
```

---

## Performance : avant et apres

### Avant (granularite grossiere)

```tsx
// Chaque TodoItem se re-rend lorsque N'IMPORTE QUEL todo change
function TodoList() {
  const todos = useSelector(state => state.todos.items);
  return todos.map(todo => <TodoItem key={todo.id} todo={todo} />);
}
```

### Apres (granularite fine avec Quo.js)

```tsx
// Chaque TodoItem se re-rend UNIQUEMENT lorsque ses propres donnees changent
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

[Voir la comparaison complete des flamegraphs.](https://github.com/quojs/quojs/blob/main/examples/v0/quojs-in-react/redux-quojs-profiler.md)

---

## Compatibilite React 18+

- **Concurrent Mode :** Entierement compatible. Tous les hooks utilisent `useSyncExternalStore`.
- **Strict Mode :** La deduplication d'evenements empeche le double traitement.
- **Suspense :** `useSuspenseAtomicProp` et `useSuspenseAtomicProps` lancent des promesses pour les limites `<Suspense>`.

---

## Exemples

- **[Application de taches avec Profiler](../../examples/v0/quojs-in-react)** -- CRUD complet avec comparaison de flamegraphs
- **[Logo Cinetique (1000+ particules)](../../examples/v0/quojs-kinetic-logo)** -- Abonnements independants par cercle SVG
- **[Next.js 15 App Router](../../examples/v0/quojs-in-nextjs)** -- SSR + commutation de theme

---

## Documentation

- **[README racine de Quo.js](https://github.com/quojs/quojs/blob/main/README.md)** -- Presentation et demarrage rapide
- **[API @quojs/core](https://github.com/quojs/quojs/blob/main/packages/core/README.md)** -- Store, middleware, effets, matchers `When`
- **[Guide de demarrage rapide](https://github.com/quojs/quojs/blob/main/docs/en/QUICK_START_GUIDE.md)** -- Cinq etapes pour une application fonctionnelle
- **[Comparaison des bibliotheques](https://github.com/quojs/quojs/blob/main/docs/en/design/state-management-library-comparison.md)** -- Comparaison architecturale

---

## Contribuer

- [Racine du monorepo](../../)
- [Guide de contribution](../../CONTRIBUTING.md)

---

## Statut

**Release Candidate (v0.7.0+)** -- Les APIs sont stables, utilisees en production, des changements mineurs sont possibles avant la v1.0.

---

## Licence

**MIT** -- Libre d'utilisation dans les projets commerciaux et open source.
