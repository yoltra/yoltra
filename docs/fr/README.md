![Quo.js logo](https://quojs.dev/assets/logo.svg)

# Quo.js

> [ 🇲🇽 Versión en Español](https://github.com/quojs/quojs/blob/main/docs/es/README.md)&nbsp; |
> &nbsp;[ 🇵🇹 Versão Portuguesa](https://github.com/quojs/quojs/blob/main/docs/pt/README.md)&nbsp;
> | &nbsp;[ 🇺🇸 English Version](https://github.com/quojs/quojs/blob/main/README.md)&nbsp; |
> &nbsp; 👉 [ 🇫🇷 Version française](https://github.com/quojs/quojs/blob/main/docs/fr/README.md)

![Taille du bundle](https://img.shields.io/bundlephobia/min/@quojs/core)
![Taille du bundle](https://img.shields.io/bundlephobia/minzip/@quojs/core)
![Taille npm decompresse](https://img.shields.io/npm/unpacked-size/@quojs/core)
![Telechargements npm](https://badgen.net/npm/dm/@quojs/core)
![Licence](https://img.shields.io/npm/l/@quojs/core)

**Reactivite a granularite fine pour les applications orientees evenements.**

![Demo du Logo Cinetique](https://quojs.dev/assets/examples/quojs-dots.gif)

> Plus de 1000 cercles SVG, chacun s'abonnant a sa propre position via `useAtomicProp`. Chaque cercle se re-rend independamment -- le reste de l'arbre n'est pas touche. [Voir le code source de la demo.](https://github.com/quojs/quojs/blob/main/examples/v0/quojs-kinetic-logo/README.md)

---

## La presentation en 30 secondes

```tsx
import { useAtomicProp, useEmit } from './hooks';

function TodoTitle({ index }: { index: number }) {
  // S'abonne a items[index].title -- ne se re-rend QUE lorsque celui-ci change.
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

Pas de selecteurs. Pas de memoisation. Pas d'optimisation manuelle. L'abonnement *est* l'optimisation.

---

## Pourquoi Quo.js ?

### 1. Abonnements fins aux chemins avec wildcards

Abonnez-vous a `"items.0.title"` ou `"items.*.done"` et ne re-rendez que lorsque ce chemin exact change. Cela fonctionne sur un arbre d'etat complet -- y compris les objets imbriques, les tableaux et les cles dynamiques.

```tsx
// Chemin exact -- se re-rend lorsque items[0].title change
const title = useAtomicProp({ reducer: 'todos', property: 'items.0.title' });

// Wildcard -- se re-rend lorsque N'IMPORTE QUEL indicateur 'done' d'un element change
const allDone = useAtomicProp(
  { reducer: 'todos', property: 'items.*.done' },
  (state) => state.items.every(i => i.done),
);
```

[Voir la comparaison des flamegraphs (Redux vs Quo.js).](https://github.com/quojs/quojs/blob/main/examples/v0/quojs-in-react/redux-quojs-profiler.md)

### 2. Pipeline d'evenements structure

Les evenements transitent par un pipeline formel ou chaque etape est interceptable :

```
emit() -> dedup -> middleware (peut rejeter) -> reducers -> abonnes d'evenements -> effets -> abonnes grossiers
```

Le rejet par middleware cree des **evenements non confirmes** auxquels l'UI peut reagir -- utile pour l'autorisation, la validation et les patterns d'UI optimiste :

```tsx
// Afficher un avertissement lorsque le middleware bloque une suppression
useEvent('ui', 'delete', (event) => {
  showToast('La suppression a ete bloquee par les permissions');
}, 'uncommitted');
```

### 3. Organisation des evenements par canaux

Les evenements sont des tuples `(channel, type, payload)` -- un namespacing naturel qui evolue sans collisions :

```typescript
await emit('auth', 'login', credentials);
await emit('analytics', 'track', event);
await emit('ui', 'toast', { message: 'Saved!' });
```

---

## Packages

| Package | Description |
|---------|-------------|
| **[@quojs/core](https://github.com/quojs/quojs/blob/main/packages/core/README.md)** | Store agnostique du framework, reducers, middleware, effets |
| **[@quojs/react](https://github.com/quojs/quojs/blob/main/packages/react/README.md)** | Hooks React avec abonnements fins et support Suspense |

---

## Configuration rapide (React)

### 1. Installation

```bash
npm install @quojs/core @quojs/react
```

### 2. Definissez votre carte d'evenements

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

### 3. Creez le store

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

### 4. Creez des hooks types avec `createQuoHooks`

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

### 5. Fournissez et utilisez

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

## Exemples en direct

| Exemple | Description |
|---------|-------------|
| **[Logo Cinetique (1000+ particules)](https://github.com/quojs/quojs/blob/main/examples/v0/quojs-kinetic-logo/README.md)** | Simulation physique avec abonnements de chemin independants par cercle |
| **[Application de taches avec Profiler](https://github.com/quojs/quojs/blob/main/examples/v0/quojs-in-react/README.md)** | Comparaison flamegraph cote a cote avec Redux ([resultats du profiler](https://github.com/quojs/quojs/blob/main/examples/v0/quojs-in-react/redux-quojs-profiler.md)) |
| **[Next.js 15 App Router](https://github.com/quojs/quojs/blob/main/examples/v0/quojs-in-nextjs/README.md)** | Compatibilite SSR + App Router avec commutation de theme |

---

## Documentation

- **[Guide de demarrage rapide](https://github.com/quojs/quojs/blob/main/docs/en/QUICK_START_GUIDE.md)** -- Cinq etapes pour une application fonctionnelle
- **[API @quojs/core](https://github.com/quojs/quojs/blob/main/packages/core/README.md)** -- Store, middleware, effets, matchers `When`
- **[API @quojs/react](https://github.com/quojs/quojs/blob/main/packages/react/README.md)** -- Hooks, Suspense, `createQuoHooks`
- **[Architecture de la file d'evenements](https://github.com/quojs/quojs/blob/main/docs/en/design/event-queue-architecture.md)** -- Analyse technique approfondie du pipeline
- **[Comparaison des bibliotheques](https://github.com/quojs/quojs/blob/main/docs/en/design/state-management-library-comparison.md)** -- Comparaison architecturale avec Redux, Zustand, Jotai et autres

---

## Contribuer

Les contributions sont les bienvenues ! Veuillez lire :

- [Guide de contribution](https://github.com/quojs/quojs/blob/main/CONTRIBUTING.md)
- [Code de conduite](https://github.com/quojs/quojs/blob/main/CODE_OF_CONDUCT.md)
- [Gouvernance](https://github.com/quojs/quojs/blob/main/GOVERNANCE.md)
- [Mainteneurs](https://github.com/quojs/quojs/blob/main/MAINTAINERS.md)
- [Politique de securite](https://github.com/quojs/quojs/blob/main/SECURITY.md)

---

## Developpement (Monorepo)

```bash
npm i -g @microsoft/rush
rush install
rush build
rush test
```

Consultez le **[Guide du developpeur](https://github.com/quojs/quojs/blob/main/docs/en/DEVELOPER_GUIDE.md)** pour plus de details.

---

## Statut

Quo.js est au stade **Release Candidate** (v0.7.0+) :
- Les APIs sont stables et utilisees dans des applications en production
- Les types TypeScript sont stricts et complets
- Des APIs mineures peuvent encore evoluer avant la v1.0

Les retours et PRs sont les bienvenus.

---

## Licence

**MIT** -- Libre d'utilisation dans les projets commerciaux et open source.

Consultez [LICENSE](https://github.com/quojs/quojs/blob/main/LICENSE) pour plus de details.

---

## Communaute
- **Site web :** [quojs.dev](https://quojs.dev)
- **Twitter/X :** [@quojs_dev](https://twitter.com/quojs_dev)
- **GitHub Discussions :** [Rejoignez la conversation](https://github.com/quojs/quojs/discussions)
- **Issues :** [Signalez des bugs ou demandez des fonctionnalites](https://github.com/quojs/quojs/issues)
