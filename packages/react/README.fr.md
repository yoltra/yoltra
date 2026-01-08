# Liaisons React pour Quo.js

> [ 🇲🇽 Versión en Español](./README.es.md)&nbsp; |
> &nbsp;[ 🇵🇹 Versão Portuguesa](./README.pt.md)&nbsp; |
> &nbsp;[ 🇺🇸 English Version](./README.md)&nbsp; | &nbsp; 👉
> [ 🇫🇷 Version française](./README.fr.md)

![Taille du bundle](https://badgen.net/bundlephobia/min/@quojs/react)
![Taille du bundle](https://badgen.net/bundlephobia/minzip/@quojs/react)
![Taille du bundle](https://badgen.net/bundlephobia/tree-shaking/@quojs/react)
![Taille du bundle](https://badgen.net/bundlephobia/dependency-count/@quojs/react)
![Version npm](https://badgen.net/npm/v/@quojs/react)
![Téléchargements npm](https://badgen.net/npm/dm/@quojs/react)
![Licence](https://badgen.net/npm/license/@quojs/react)

**Bindings React pour Quo.js avec abonnements atomiques.**

`@quojs/react` fournit des hooks et composants React pour Quo.js, avec **contrôle de re-rendu à granularité fine**, **support de Suspense** et **compatibilité avec Concurrent Mode**.

**Zéro re-rendus inutiles par défaut.**

---

## Qu'est-ce que @quojs/react ?

Compagnon officiel de React pour **[@quojs/core](https://github.com/quojs/quojs/blob/main/packages/core/README.fr.md)**—un conteneur d'état basé sur les événements avec :

- **Abonnements atomiques** — Abonnez-vous à des chemins d'état exacts, ne re-rend que lorsqu'ils changent
- **Support natif pour async** — Middleware et effects intégrés, sans thunks/sagas
- **Événements basés sur des canaux** — Organisez les événements par canal pour éviter les collisions de noms
- **Garanties d'immuabilité** — Application de deep-freeze avec détection précise des changements

---

## Fonctionnalités Principales

- 🎯 **Props Atomiques** — `useAtomicProp` s'abonne à des chemins exacts (`'todos.items.0.title'`)
- ⚡ **Zéro Rendus Gaspillés** — Re-rend uniquement lorsque les chemins abonnés changent réellement
- 🔮 **Prêt pour Suspense** — `useSuspenseAtomicProp` pour les modèles de récupération de données
- 🧩 **Concurrent Mode** — Entièrement compatible avec les fonctionnalités concurrentes de React 18+
- 🛡️ **TypeScript-First** — Excellente inférence de types et autocomplétion
- 📌 **Léger** — ~7KB (minifié + gzippé)

---

## Installation

```bash
npm install @quojs/core @quojs/react
# ou
yarn add @quojs/core @quojs/react
# ou
pnpm add @quojs/core @quojs/react
```

**Dépendances peer :** React 18+ (testé avec React 18 et 19)

---

## Démarrage Rapide

### 1. Créez Votre Store

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
  name: 'App',
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

### 2. Créez le Contexte du Store

```typescript
// StoreContext.ts
import { createContext } from 'react';
import type { AppStore } from './store';

export const StoreContext = createContext<AppStore | null>(null);
```

### 3. Créez des Hooks Typés

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

### 4. Fournissez le Store

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

### 5. Utilisez les Hooks dans les Composants

```tsx
// Counter.tsx
import { useAtomicProp, useEmit } from './hooks';

export function Counter() {
  // Re-rend uniquement lorsque counter.value change
  const value = useAtomicProp({ reducer: 'counter', property: 'value' });
  const emit = useEmit();

  return (
    <div>
      <h1>Compteur : {value}</h1>
      <button onClick={() => emit('counter', 'increment', 1)}>+</button>
      <button onClick={() => emit('counter', 'decrement', 1)}>-</button>
      <button onClick={() => emit('counter', 'reset', null)}>Réinitialiser</button>
    </div>
  );
}
```

---

## Référence de l'API

### Composants

#### `<StoreProvider>`

Fournit le store Quo.js aux composants React via le contexte.

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

Retourne l'instance du store.

```tsx
const store = useStore();
const state = store.getState();
```

---

#### `useEmit()`

Retourne la fonction `emit` typée.

```tsx
const emit = useEmit();

// Émettez des événements (entièrement typé)
await emit('counter', 'increment', 1);
await emit('todos', 'add', { id: '1', title: 'Acheter du lait' });
```

**Remplace :** `useDispatch()` (déprécié dans la v0.5.0)

---

#### `useSelector(selector, isEqual?)`

Sélectionne l'état dérivé via une fonction de sélection.

```tsx
const count = useSelector((state) => state.counter.value);

// Avec égalité personnalisée
import { shallowEqual } from './hooks';

const todos = useSelector(
  (state) => state.todos.items,
  shallowEqual
);
```

**Re-rend :** Lorsque la valeur sélectionnée change (selon `isEqual`)

---

#### `useAtomicProp({ reducer, property })`

**La fonctionnalité phare.** S'abonne à un chemin d'état spécifique—re-rend uniquement lorsque ce chemin exact change.

```tsx
// Re-rend uniquement lorsque items[0].title change
const title = useAtomicProp({ 
  reducer: 'todos', 
  property: 'items.0.title' 
});

// Avec fonction mapper
const count = useAtomicProp(
  { reducer: 'todos', property: 'items' },
  (items) => items.length
);

// Modèles wildcard
const allTitles = useAtomicProp(
  { reducer: 'todos', property: 'items.*.title' },
  (state) => state.items.map(t => t.title)
);
```

**Avantages :**
- ✅ Zéro re-rendus inutiles
- ✅ Aucune optimisation manuelle requise
- ✅ Fonctionne avec des chemins profonds et des wildcards

---

#### `useAtomicProps(specs, selector, isEqual?)`

S'abonne à plusieurs chemins, recalcule le sélecteur lorsque l'un change.

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

**Cas d'usage :** État dérivé qui dépend de plusieurs slices

---

#### `useSuspenseAtomicProp({ reducer, property }, options)`

Version activée pour Suspense de `useAtomicProp`.

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
    staleTime: 60000, // 1 minute
  }
);

// Le composant se suspend pendant le chargement
```

**Fonctionnalités :**
- Gestion automatique du cache
- Temps d'obsolescence configurable
- Fonctionne avec les limites `<Suspense>`

---

#### `useSuspenseAtomicProps(specs, options)`

Version activée pour Suspense de `useAtomicProps`.

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

### Utilitaires de Suspense

#### `invalidateAtomicProp(reducer, property, key?)`

Invalide le cache pour une propriété spécifique.

```tsx
import { invalidateAtomicProp } from '@quojs/react';

// Après une mutation
await emit('user', 'update', newData);
invalidateAtomicProp('user', 'profile');
```

---

#### `invalidateAtomicPropsByReducer(reducer)`

Invalide toutes les entrées de cache pour un reducer.

```tsx
import { invalidateAtomicPropsByReducer } from '@quojs/react';

invalidateAtomicPropsByReducer('todos');
```

---

#### `clearSuspenseCache()`

Efface tout le cache de Suspense.

```tsx
import { clearSuspenseCache } from '@quojs/react';

clearSuspenseCache();
```

---

## Comparaison des Performances

### Redux / Zustand (Granularité grossière)

```tsx
// ❌ Re-rend lorsque N'IMPORTE QUELLE tâche change
const todos = useSelector(state => state.todos.items);

return <div>{todos.map(todo => ...)}</div>;
```

**Problème :** Tout l'arbre de composants re-rend à chaque changement de tâche.

### Quo.js (Granularité fine)

```tsx
// ✅ Re-rend uniquement lorsque CETTE tâche spécifique change
function TodoItem({ id }) {
  const title = useAtomicProp({ 
    reducer: 'todos', 
    property: `items.${id}.title` 
  });
  
  return <div>{title}</div>;
}
```

**Résultat :** Zéro rendus gaspillés.

[Voir la comparaison des flamegraphs →](https://github.com/quojs/quojs/blob/main/examples/v0/quojs-in-react/redux-quojs-profiler.fr.md)

---

## Support TypeScript

Les hooks React de Quo.js sont entièrement typés :

```typescript
type AppEM = {
  todos: {
    add: { id: string; title: string };
    toggle: { id: string };
  };
};

const emit = useEmit<AppEM>();

// ✅ L'autocomplétion fonctionne
await emit('todos', 'add', { 
  id: '1',
  title: 'Acheter du lait'
});

// ❌ TypeScript détecte les erreurs
await emit('todos', 'add', { id: 1 }); // Erreur : id doit être string
await emit('invalid', 'event', null);  // Erreur : Canal inconnu
```

---

## Fonctionnalités de React 18+

### Concurrent Mode

Quo.js est entièrement compatible avec le rendu concurrent de React 18 :

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
  
  return <div>Bienvenue, {user.name} !</div>;
}
```

---

## Migration depuis v0.4.x

### Changements de Noms de Hooks (v0.5.0)

| Ancien (v0.4.x) | Nouveau (v0.5.0) | Statut |
|-----------------|------------------|--------|
| `useDispatch()` | `useEmit()` | ⚠️ Déprécié (fonctionne encore avec avertissement) |
| `useSliceProp()` | ❌ Supprimé | Utilisez `useAtomicProp()` |
| `useSliceProps()` | ❌ Supprimé | Utilisez `useAtomicProps()` |

### Exemple de Migration

```tsx
// AVANT (v0.4.x)
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

// APRÈS (v0.5.0)
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

---

## Exemples

- **[Application de Tâches](../../examples/v0/quojs-in-react/README.fr.md)** — CRUD complet avec profilage des performances
- **[Logo Cinétique](../../examples/v0/quojs-kinetic-logo/README.fr.md)** — 900 cercles SVG + simulation physique
- **[Next.js 15](../../examples/v0/quojs-in-nextjs/README.fr.md)** — SSR + sélecteur de thème

---

## Documentation

- **[Guide de Démarrage Rapide](https://quojs.dev)** — Commencez en 5 minutes
- **[Référence API TypeDoc](./docs/README.md)** — Documentation complète de l'API
- **[Comparaison des Bibliothèques](../../docs/library-comparison.md)** — vs Redux, Zustand, Jotai, etc.

---

## Contribuer

Voir :
- [Racine du Monorepo](../../docs/fr/README.md)
- [Guide de Contribution](../../docs/fr/CONTRIBUTING.md)
- [Code de Conduite](../../docs/fr/CODE_OF_CONDUCT.md)

---

## Statut

**Release Candidate** — Les APIs sont stables, utilisées en production, changements mineurs possibles avant la v1.0.

---

## Licence

**MIT** — Libre d'utilisation dans les projets commerciaux et open source.

---

Fait au 🇲🇽 pour le monde.