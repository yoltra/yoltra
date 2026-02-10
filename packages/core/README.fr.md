![Quo.js logo](../../assets/logo.svg)

# @quojs/core

> [ 🇲🇽 Versión en Español](https://github.com/quojs/quojs/blob/main/packages/core/README.es.md)&nbsp;
> | &nbsp;[ 🇵🇹 Versão Portuguesa](https://github.com/quojs/quojs/blob/main/packages/core/README.pt.md)&nbsp;
> | &nbsp;[ 🇺🇸 English Version](https://github.com/quojs/quojs/blob/main/packages/core/README.md)&nbsp;
> | &nbsp; 👉 [ 🇫🇷 Version française](https://github.com/quojs/quojs/blob/main/packages/core/README.fr.md)

![Taille du bundle](https://badgen.net/bundlephobia/min/@quojs/core)
![Taille du bundle](https://badgen.net/bundlephobia/minzip/@quojs/core)
![Taille du bundle](https://badgen.net/bundlephobia/tree-shaking/@quojs/core)
![Taille du bundle](https://badgen.net/bundlephobia/dependency-count/@quojs/core)
![Version npm](https://badgen.net/npm/v/@quojs/core)
![Telechargements npm](https://badgen.net/npm/dm/@quojs/core)
![Licence](https://badgen.net/npm/license/@quojs/core)

**Conteneur d'etat pilote par evenements, agnostique du framework, avec abonnements fins aux chemins.**

`@quojs/core` est la fondation de [Quo.js](https://github.com/quojs/quojs/blob/main/README.md). Il fournit le store, le pipeline d'evenements, le middleware, les effets et le systeme d'abonnement `connect()`. Zero dependance framework.

---

## Installation

```bash
npm install @quojs/core
```

---

## Le pipeline d'evenements

Chaque appel a `emit()` transite par un pipeline deterministe :

```
emit(channel, type, payload)
  |
  +- 1. Dedup --- Ignore si empreinte identique dans la fenetre de temps
  |
  +- 2. Middleware --- Hooks pre-reducer (peut rejeter -> evenement "non confirme")
  |
  +- 3. Reducers --- Mises a jour synchrones de l'etat, detection fine des changements de chemin
  |
  +- 4. Abonnes d'evenements --- Notifications d'evenements confirmes/non confirmes
  |
  +- 5. Effets --- Effets secondaires async (post-reducer, indexes pour recherche O(1))
  |
  +- 6. Abonnes grossiers --- Listeners de store externes (useSyncExternalStore, etc.)
```

Chaque etape est interceptable. Le middleware peut annuler des evenements, creant des evenements "non confirmes" auxquels l'UI peut malgre tout reagir. Les effets s'executent apres les reducers et voient l'etat final.

---

## Concepts fondamentaux

### Evenements par canaux

Les evenements sont des tuples `(channel, type, payload)`. Les canaux fournissent un namespacing naturel qui evolue dans les grandes bases de code :

```typescript
await store.emit('auth', 'login', credentials);
await store.emit('analytics', 'track', { event: 'page_view' });
await store.emit('ui', 'toast', { message: 'Saved!' });
```

### Abonnements fins via `connect()`

Abonnez-vous a des chemins d'etat exacts en utilisant la notation pointee. Supporte `*` (un segment) et `**` (zero ou plusieurs segments) comme wildcards :

```typescript
// Chemin exact -- se declenche lorsque items[0].title change
store.connect(
  { reducer: 'todos', property: 'items.0.title' },
  (change) => console.log('title:', change.oldValue, '->', change.newValue),
);

// Wildcard simple -- se declenche lorsque le titre de N'IMPORTE QUEL element change
store.connect(
  { reducer: 'todos', property: 'items.*.title' },
  (change) => console.log('some title changed at', change.path),
);

// Wildcard profond -- se declenche lorsque quoi que ce soit sous items change
store.connect(
  { reducer: 'todos', property: 'items.**' },
  (change) => console.log('items tree changed at', change.path),
);
```

### Immutabilite

L'etat est deep-frozen avant le commit. Les mutations levent une erreur en mode strict :

```typescript
const state = store.getState();
state.counter.value = 999; // TypeError: Cannot assign to read-only property
```

---

## Ciblage d'evenements avec les matchers `When`

Les reducers, effets et middleware utilisent un matcher `When` unifie pour declarer les evenements auxquels ils reagissent :

```typescript
import { createStore, eventKeys } from '@quojs/core';

type AppEM = {
  ui: { increment: number; decrement: number; reset: void };
  admin: { setCounter: number };
  system: { init: void; shutdown: void };
};

// Cles d'evenements specifiques (recommande -- preserve la correlation des types)
const counterReducer = {
  state: { value: 0 },
  when: { keys: eventKeys<AppEM>()([['ui', 'increment'], ['ui', 'decrement']]) },
  reducer: (state, event) => {
    if (event.type === 'increment') return { value: state.value + event.payload };
    if (event.type === 'decrement') return { value: state.value - event.payload };
    return state;
  },
};

// Tous les evenements d'un canal
const uiLogger = {
  when: { channel: 'ui' },
  effect: (event) => console.log('UI event:', event.type),
};

// Evenements de plusieurs canaux
const auditTrail = {
  when: { channels: ['ui', 'admin'] },
  effect: (event) => logToAuditTrail(event),
};

// TOUS les evenements
const globalLogger = {
  when: { any: true },
  middleware: (state, event) => {
    console.log(`[${event.channel}] ${event.type}`);
    return true;
  },
};
```

---

## Middleware

Le middleware s'execute **avant** les reducers et peut annuler la propagation des evenements. Supporte les fonctions brutes (ancien mode) et les objets `MiddlewareSpec` avec ciblage :

```typescript
import type { MiddlewareSpec } from '@quojs/core';

// Middleware cible -- s'execute uniquement pour les evenements du canal admin
const adminGuard: MiddlewareSpec<AppState, AppEM> = {
  when: { channel: 'admin' },
  middleware: (state, event) => {
    if (!state.auth.isAdmin) return false; // Rejeter -> cree un evenement "non confirme"
    return true;
  },
  meta: { type: 'middleware', name: 'adminGuard' },
};

// Middleware global -- s'execute pour tous les evenements
const logger = async (state, event, emit) => {
  console.log('Event:', event.channel, event.type);
  return true;
};

const store = createStore({
  name: 'App',
  reducer: { /* ... */ },
  middleware: [adminGuard, logger],
});
```

### Middleware dynamique

```typescript
const off = store.registerMiddleware(async (state, event) => {
  return event.type !== 'forbidden';
});
off(); // Retirer plus tard
```

---

## Effets

Les effets s'executent **apres** les reducers et voient l'etat final. Ils sont indexes par evenement pour une recherche O(1) :

```typescript
// Via la specification du store
const store = createStore({
  name: 'App',
  reducer: { /* ... */ },
  effects: [{
    when: { keys: eventKeys<AppEM>()([['todos', 'add'], ['todos', 'delete']]) },
    effect: async (event, getState, emit) => {
      await saveToServer(getState());
    },
    meta: { type: 'effect', name: 'syncToServer' },
  }],
});

// Enregistrement dynamique
const off = store.registerEffect({
  when: { channel: 'analytics' },
  effect: async (event) => sendToAnalytics(event),
});

// Raccourci pour un seul evenement
const off2 = store.onEffect('ui', 'save', async (payload, getState, emit) => {
  await saveToCloud(payload);
});
```

---

## Abonnements aux evenements

Abonnez-vous aux evenements (pas a l'etat) depuis la couche vue. Utile pour les notifications, animations et la reaction aux evenements rejetes :

```typescript
// Evenements confirmes (par defaut) -- evenements ayant passe le middleware
const off = store.onEvent('ui', 'save', (event, getState, emit, phase) => {
  console.log('Save committed:', event.payload);
});

// Evenements non confirmes -- evenements rejetes par le middleware
store.onEvent('ui', 'delete', (event, getState, emit, phase) => {
  console.log('Delete was rejected');
}, 'uncommitted');

// Tous les evenements -- confirmes et non confirmes
store.onEvent('ui', 'action', (event, getState, emit, phase) => {
  console.log(`Action ${phase}:`, event.type);
}, 'all');
```

---

## Deduplication d'evenements

Quo.js deduplique automatiquement les evenements identiques dans une fenetre de temps configurable. Cela empeche le double traitement en React Strict Mode :

```typescript
const store = createStore({
  name: 'App',
  reducer: { /* ... */ },
  dedupWindowMs: 100, // defaut : 50ms en dev, 100ms en prod
});
```

---

## Reducers dynamiques

Ajoutez ou supprimez des slices de reducer a l'execution :

```typescript
const dispose = store.registerReducer('filters', {
  state: { q: '' },
  when: { keys: eventKeys<AppEM>()([['ui', 'setQuery']]) },
  reducer: (state, event) =>
    event.type === 'setQuery' ? { q: event.payload } : state,
});

// Plus tard : supprimez le slice et son etat
dispose();
```

---

## Hot Module Replacement

```typescript
if (import.meta.hot) {
  import.meta.hot.accept('./reducers', (mod) => {
    store.replaceReducers(mod.reducers, { preserveState: true });
  });

  import.meta.hot.accept('./middleware', (mod) => {
    store.replaceMiddleware(mod.middleware);
  });

  import.meta.hot.accept('./effects', (mod) => {
    store.replaceEffects(mod.effects);
  });

  // Ou remplacez tout d'un coup
  store.hotReplace({
    reducer: newReducers,
    middleware: newMiddleware,
    effects: newEffects,
    preserveState: true,
  });
}
```

---

## Bonnes pratiques

### Toujours attendre `emit()`

```typescript
await emit('todo', 'add', todo);
const state = store.getState(); // Garanti de refleter la nouvelle tache
```

### Garder les reducers rapides

Les reducers sont synchrones et bloquent la file d'evenements. Deplacez le travail couteux vers les effets :

```typescript
// Reducer : juste positionner un flag de chargement
reducer: (state, event) => ({ ...state, loading: true }),

// Effet : faire le gros du travail
store.onEffect('data', 'compute', async (payload, getState, emit) => {
  const result = await computeAsync();
  await emit('data', 'computeComplete', result);
});
```

### Gerer les erreurs d'effets

```typescript
store.registerEffect({
  when: { channel: 'data' },
  effect: async (event, getState, emit) => {
    try {
      const data = await fetch(url);
      await emit('data', 'loadSuccess', data);
    } catch (error) {
      await emit('data', 'loadFailure', { error: error.message });
    }
  },
});
```

---

## Apercu de l'API

### Creation de store

| API | Description |
|-----|-------------|
| `createStore(spec)` | Creer un store (types inferes depuis les reducers) |
| `createStore<S, EM>(spec)` | Creer un store avec types etat/evenements explicites |
| `store.emit(channel, type, payload)` | Emettre un evenement (retourne une promesse) |
| `store.getState()` | Obtenir un instantane en lecture seule de l'etat actuel |
| `store.subscribe(listener)` | Abonnement grossier (tout changement d'etat) |
| `store.connect(spec, handler)` | Abonnement fin aux chemins avec wildcards |
| `store.onEvent(channel, type, handler, phase?)` | Abonnement aux evenements (confirme/non confirme/tous) |
| `store.onEffect(channel, type, handler)` | Raccourci d'effet pour un seul evenement |
| `store.dispose()` | Nettoyer les timers et ressources |

### Enregistrement dynamique

| API | Description |
|-----|-------------|
| `store.registerReducer(name, spec)` | Ajouter un slice a l'execution |
| `store.registerMiddleware(fn)` | Ajouter un middleware a l'execution |
| `store.registerEffect(spec)` | Ajouter un effet a l'execution |

### HMR

| API | Description |
|-----|-------------|
| `store.replaceReducers(reducers, opts)` | Remplacer tous les reducers |
| `store.replaceMiddleware(middleware)` | Remplacer tous les middlewares |
| `store.replaceEffects(effects)` | Remplacer tous les effets |
| `store.hotReplace(partial)` | Remplacer n'importe quel sous-ensemble d'un coup |

### Utilitaires

| API | Description |
|-----|-------------|
| `eventKeys<EM>()([...])` | Tableaux de cles d'evenements type-safe sans `as const` |

---

## Performance

| Metrique | Valeur |
|----------|--------|
| **Taille du bundle** | ~8KB (minifie + gzippe) |
| **Tree-shakeable** | Oui (modules ES) |
| **Dependances** | Zero |
| **TypeScript** | Definitions de types completes incluses |

---

## Documentation

- **[README racine de Quo.js](https://github.com/quojs/quojs/blob/main/README.md)** -- Presentation et demarrage rapide
- **[@quojs/react](https://github.com/quojs/quojs/blob/main/packages/react/README.md)** -- Hooks React et Suspense
- **[Guide de demarrage rapide](https://github.com/quojs/quojs/blob/main/docs/en/QUICK_START_GUIDE.md)** -- Cinq etapes pour une application fonctionnelle
- **[Architecture de la file d'evenements](https://github.com/quojs/quojs/blob/main/docs/en/design/event-queue-architecture.md)** -- Analyse technique approfondie
- **[Comparaison des bibliotheques](https://github.com/quojs/quojs/blob/main/docs/en/design/state-management-library-comparison.md)** -- Comparaison architecturale

---

## Exemples

- **[Application de taches](https://github.com/quojs/quojs/blob/main/examples/v0/quojs-in-react)** -- CRUD complet avec profilage de performance
- **[Logo Cinetique](https://github.com/quojs/quojs/blob/main/examples/v0/quojs-kinetic-logo)** -- Plus de 1000 cercles SVG avec simulation physique
- **[Integration Next.js](https://github.com/quojs/quojs/blob/main/examples/v0/quojs-in-nextjs)** -- SSR + App Router + commutation de theme

---

## Contribuer

- [Racine du monorepo](https://github.com/quojs/quojs/blob/main/README.md)
- [Guide de contribution](https://github.com/quojs/quojs/blob/main/CONTRIBUTING.md)

---

## Statut

**Release Candidate (v0.7.0+)** -- Les APIs sont stables, utilisees en production, des changements mineurs sont possibles avant la v1.0.

---

## Licence

**MIT** -- Libre d'utilisation dans les projets commerciaux et open source.
