![Quo.js logo](https://quojs.dev/assets/logo.svg)

# Quo.js L'état des choses, réécrit.

> [ 🇲🇽 Versión en Español](https://github.com/quojs/quojs/blob/main/packages/core/README.es.md) &nbsp; |
> &nbsp;[ 🇵🇹 Versão Portuguesa](https://github.com/quojs/quojs/blob/main/packages/core/README.pt.md)&nbsp; |
> &nbsp;[ 🇺🇸 English Version](https://github.com/quojs/quojs/blob/main/packages/core/README.md)&nbsp; |
> &nbsp; 👉 [ 🇫🇷 Version française](https://github.com/quojs/quojs/blob/main/packages/core/README.fr.md)

![Taille du bundle](https://badgen.net/bundlephobia/min/@quojs/core)
![Taille du bundle](https://badgen.net/bundlephobia/minzip/@quojs/core)
![Taille du bundle](https://badgen.net/bundlephobia/tree-shaking/@quojs/core)
![Taille du bundle](https://badgen.net/bundlephobia/dependency-count/@quojs/core)
![Version npm](https://badgen.net/npm/v/@quojs/core)
![Téléchargements npm](https://badgen.net/npm/dm/@quojs/core)
![Licence](https://badgen.net/npm/license/@quojs/core)

**Conteneur d'état basé sur les événements, agnostique du framework.**

`@quojs/core` est la fondation de Quo.js—une bibliothèque moderne de gestion d'état qui combine
**des événements basés sur des canaux**, **des abonnements atomiques** et **un support natif
pour async** dans un package léger et universel.

**Fonctionne partout :** Navigateurs, Node.js 18+, Deno, Bun. Zéro dépendance DOM.

---

## Qu'est-ce que @quojs/core ?

`@quojs/core` fournit :

- **Architecture basée sur les événements** — Les événements circulent via des canaux
  `(channel, type, payload)`
- **File d'événements FIFO** — Traitement d'événements prévisible et sérialisé avec garanties
  d'ordre
- **Async-first** — Middleware et effects async natifs (sans thunks/sagas)
- **Abonnements à granularité fine** — Abonnez-vous à des chemins d'état exacts via notation
  pointée
- **Immuabilité** — Application de deep-freeze avec détection de changements structurels
- **TypeScript-first** — Excellente inférence de types et autocomplétion

> Consultez le rapport de
> [Comparaison des Bibliothèques de Gestion d'État](https://github.com/quojs/quojs/blob/main/docs/fr/design/state-management-library-comparison.md).

---

## Installation

```bash
npm install @quojs/core
# ou
yarn add @quojs/core
# ou
pnpm add @quojs/core
```

---

## Guide de démarrage rapide

- [@quojs/core - Guide de démarrage rapide](https://github.com/quojs/quojs/blob/main/docs/fr/QUICK_START_GUIDE.md)

---

## Concepts Fondamentaux

### Architecture Basée sur les Événements

Les événements sont des citoyens de première classe dans Quo.js. Chaque changement d'état est
déclenché par un événement explicite.

```typescript
// Les événements ont un canal, un type et un payload
await store.emit("auth", "login", { username, password });
await store.emit("analytics", "track", { event: "page_view" });
await store.emit("ui", "toast", { message: "Bienvenue !" });
```

**Avantages :**

- Intention claire (chaque action est traçable)
- Modularité naturelle (organisez par canal)
- Piste d'audit (les événements sont sérialisables)

Consultez le document de présentation de
l'**[Architecture de File d'Événements](https://github.com/quojs/quojs/blob/main/docs/fr/design/event-queue-architecture.md)**.

### Async-First

Les middlewares et effects sont `async` par défaut. Aucune bibliothèque externe nécessaire.

```typescript
// Middleware asynchrone
const authMiddleware = async (state, event, emit) => {
  if (event.type === "login") {
    const token = await authenticateUser(event.payload);
    await emit("auth", "loginSuccess", { token });
    return false; // Annule l'événement original
  }
  return true;
};

// Effects asynchrones (s'exécutent après les reducers)
const analyticsEffect = async (event, getState, emit) => {
  if (event.channel === "analytics") {
    await sendToAnalytics(event.payload);
  }
};

const store = createStore({
  name: "App",
  reducer: {
    /* ... */
  },
  middleware: [authMiddleware],
  effects: [
    {
      events: [["analytics", "track"]],
      effect: analyticsEffect,
    },
  ],
});
```

### Abonnements à Granularité Fine

Abonnez-vous à des chemins d'état exacts en utilisant la notation pointée :

```typescript
// S'abonner à un chemin imbriqué
store.connect({ reducer: "todos", property: "items.0.title" }, (change) => {
  console.log("Le titre de la première tâche a changé :", change.newValue);
});

// Modèles wildcard
store.connect({ reducer: "todos", property: "items.*.completed" }, (change) => {
  console.log("Le statut de complétion d'une tâche a changé");
});
```

### Garanties d'Immuabilité

L'état est **deep-frozen** avant d'être confirmé pour empêcher les mutations accidentelles :

```typescript
const state = store.getState();
state.counter.value = 999; // ❌ TypeError : Impossible d'assigner à une propriété en lecture seule

// À la place, émettez des événements :
await store.emit("counter", "set", 999); // ✅ Manière correcte
```

---

## Meilleures Pratiques

### Code d'Application

#### 1. Toujours Attendre `emit()`

```typescript
// ❌ MAUVAIS : Déclencher et oublier
emit("todo", "add", todo);
const state = store.getState(); // Peut ne pas avoir la nouvelle tâche encore !

// ✅ BON : Attendre la complétion
await emit("todo", "add", todo);
const state = store.getState(); // Garanti d'avoir la nouvelle tâche
```

#### 2. Éviter les Boucles Infinies

```typescript
// ❌ MAUVAIS : Récursion infinie
registerEffect({
  events: [["counter", "increment"]],
  effect: (evt, getState, emit) => {
    emit("counter", "increment", evt.payload + 1); // Infini !
  },
});

// ✅ BON : Condition de garde
registerEffect({
  events: [["counter", "increment"]],
  effect: (evt, getState, emit) => {
    if (evt.payload < 100) {
      // Arrêter à 100
      emit("counter", "increment", evt.payload + 1);
    }
  },
});
```

#### 3. Garder les Reducers Rapides

```typescript
// ❌ MAUVAIS : Reducer lent bloque la file
reducer: (state, event) => {
  const result = expensiveComputation(); // Bloque pendant des secondes
  return { ...state, result };
};

// ✅ BON : Déplacer vers un effect asynchrone
reducer: (state, event) => {
  return { ...state, loading: true };
};

registerEffect({
  events: [["data", "compute"]],
  effect: async (evt, getState, emit) => {
    const result = await computeAsync(); // Ne bloque pas
    emit("data", "computeComplete", result);
  },
});
```

#### 4. Gérer les Erreurs d'Effects

```typescript
// ❌ MAUVAIS : Erreurs d'effect non gérées
effect: async (evt, getState, emit) => {
  const data = await fetch(url); // Peut lancer une erreur
  emit("data", "loaded", data);
};

// ✅ BON : Gestion des erreurs avec événements d'échec
effect: async (evt, getState, emit) => {
  try {
    const data = await fetch(url);
    emit("data", "loadSuccess", data);
  } catch (error) {
    emit("data", "loadFailure", { error: error.message });
  }
};
```

#### 5. Limiter les Événements à Haute Fréquence

```typescript
// ❌ MAUVAIS : Inonde la file
window.addEventListener("mousemove", (e) => {
  emit("ui", "mouseMove", { x: e.clientX, y: e.clientY });
});

// ✅ BON : Limiter les émissions
import { throttle } from "lodash-es";

const throttledEmit = throttle(
  (x, y) => emit("ui", "mouseMove", { x, y }),
  16, // ~60fps
);

window.addEventListener("mousemove", (e) => {
  throttledEmit(e.clientX, e.clientY);
});
```

---

## Fonctionnalités Avancées

### Reducers Dynamiques

Ajoutez ou supprimez des reducers à l'exécution :

```typescript
// Ajouter un nouveau reducer dynamiquement
const disposeReducer = store.registerReducer("newFeature", {
  state: { enabled: false },
  events: [["features", "toggle"]],
  reducer: (state, event) => {
    return { enabled: !state.enabled };
  },
});

// Plus tard : supprimer le reducer
disposeReducer();
```

### Déduplication d'Événements

Quo.js empêche automatiquement le traitement en double des événements (compatible avec React
Strict Mode) :

```typescript
// En React Strict Mode, les effects se déclenchent deux fois en développement
useEffect(() => {
  emit("analytics", "pageView", { page });
  // ↑ Déclenché 2x par React, mais Quo.js le traite une seule fois
}, [page]);
```

### Middleware

Le middleware s'exécute **avant** les reducers et peut annuler les événements :

```typescript
const loggingMiddleware = async (state, event, emit) => {
  console.log("Événement :", event.channel, event.type, event.payload);
  return true; // Permettre à l'événement de continuer
};

const validationMiddleware = async (state, event) => {
  if (event.type === "addTodo" && !event.payload.title) {
    console.error("Tâche invalide : titre manquant");
    return false; // Annuler l'événement
  }
  return true;
};
```

### Effects

Les effects s'exécutent **après** les reducers et sont parfaits pour les effets secondaires :

```typescript
const saveToLocalStorageEffect = async (event, getState) => {
  const state = getState();
  localStorage.setItem("app-state", JSON.stringify(state));
};

store.registerEffect({
  events: [
    ["todos", "add"],
    ["todos", "toggle"],
    ["todos", "delete"],
  ],
  effect: saveToLocalStorageEffect,
});
```

---

## Support TypeScript

Quo.js est TypeScript-first avec une excellente inférence de types :

```typescript
// La carte d'événements est entièrement typée
type AppEM = {
  counter: {
    increment: number; // Type de payload
    decrement: number;
  };
};

const store = createStore<AppEM>({
  /* ... */
});

// ✅ L'autocomplétion fonctionne :
await store.emit("counter", "increment", 5);
// ↑ Suggère : 'increment' | 'decrement'
// ↑ Attend : number

// ❌ TypeScript détecte les erreurs :
await store.emit("counter", "increment", "five"); // Erreur : number attendu
await store.emit("invalid", "event", null); // Erreur : Canal inconnu
```

---

## Runtime Universel

`@quojs/core` a **zéro dépendance DOM** et fonctionne partout où JavaScript s'exécute :

### Navigateur

```typescript
import { createStore } from "@quojs/core";
const store = createStore({
  /* ... */
});
```

### Node.js

```typescript
const { createStore } = require("@quojs/core");

const store = createStore({
  name: "ServerState",
  reducer: {
    /* ... */
  },
});

// Utiliser dans un middleware Express, des tâches en arrière-plan, etc.
app.use((req, res, next) => {
  req.store = store;
  next();
});
```

### Deno / Bun

```typescript
import { createStore } from "@quojs/core";
// Fonctionne de manière identique aux navigateurs/Node.js
```

---

## Aperçu de l'API

### Création de Store

- `createStore(spec)` — Créer une nouvelle instance de store
- `store.emit(channel, type, payload)` — Émettre un événement (async)
- `store.getState()` — Obtenir l'état actuel (lecture seule)
- `store.subscribe(listener)` — S'abonner à tout changement d'état
- `store.connect(spec, handler)` — S'abonner à un chemin d'état spécifique

### Enregistrement Dynamique

- `store.registerReducer(name, spec)` — Ajouter un reducer à l'exécution
- `store.registerMiddleware(middleware)` — Ajouter un middleware à l'exécution
- `store.registerEffect(spec)` — Ajouter un effect à l'exécution

### Hot Module Replacement

- `store.replaceReducers(reducers, opts)` — Remplacer tous les reducers (HMR)
- `store.replaceMiddleware(middleware)` — Remplacer tous les middlewares (HMR)
- `store.replaceEffects(effects)` — Remplacer tous les effects (HMR)

---

## Performance

| Métrique             | Valeur                                  |
| -------------------- | --------------------------------------- |
| **Taille du Bundle** | ~8KB (minifié + gzippé)                 |
| **Tree-shakeable**   | ✅ Oui (modules ES)                     |
| **Dépendances**      | Zéro dépendance à l'exécution           |
| **TypeScript**       | Définitions de types complètes incluses |

---

## Documentation

- **[Guide de Démarrage Rapide](https://quojs.dev)** — Commencez en 5 minutes
- **[Référence API TypeDoc](https://github.com/quojs/quojs/blob/main/packages/core/docs/README.md)** — Documentation complète de l'API
- **[Architecture de File d'Événements](https://github.com/quojs/quojs/blob/main/docs/fr/design/event-queue-architecture.md)** — Analyse
  technique approfondie
- **[Comparaison des Bibliothèques](https://github.com/quojs/quojs/blob/main/docs/fr/design/state-management-library-comparison.md)** — vs Redux, Zustand,
  Jotai, etc.

---

## Exemples

- **[Application de Tâches](https://github.com/quojs/quojs/blob/main/examples/v0/quojs-in-react/README.fr.md)** — Exemple CRUD complet avec
  profilage des performances
- **[Logo Cinétique](https://github.com/quojs/quojs/blob/main/examples/v0/quojs-kinetic-logo/README.fr.md)** — Simulation physique avec 900
  particules
- **[Intégration Next.js](https://github.com/quojs/quojs/blob/main/examples/v0/quojs-in-nextjs/README.fr.md)** — SSR + sélecteur de thème

---

## Migration depuis v0.4.x

### Changements de Terminologie (v0.5.0+)

| Ancien (v0.4.x) | Nouveau (v0.5.0+) | Statut                                         |
| --------------- | ----------------- | ---------------------------------------------- |
| `dispatch()`    | `emit()`          | ❌ Supprimé (utilisez `emit()` à la place)     |
| `Action`        | `Event`           | ❌ Supprimé (utilisez le type `Event`)         |
| `ActionMap`     | `EventMap`        | ❌ Supprimé (utilisez le type `EventMapBase`)  |
| `ActionPair`    | `EventKey`        | ❌ Supprimé (utilisez le type `EventKey`)      |
| `ActionUnion`   | `EventUnion`      | ❌ Supprimé (utilisez le type `EventUnion`)    |
| `Dispatch`      | `Emit`            | ❌ Supprimé (utilisez le type `Emit`)          |
| `typedActions`  | `typedEvents`     | ❌ Supprimé (utilisez la fonction `typedEvents`) |
| `action.event`  | `event.type`      | ⚠️ Changement disruptif                        |

### Exemple de Migration

```typescript
// AVANT (v0.4.x)
store.dispatch("counter", "increment", 1);
const actions = typedActions([])('counter', ['increment']);
type MyAction = Action<EM, 'counter', 'increment'>;

// APRÈS (v0.5.0+)
store.emit("counter", "increment", 1);
const events = typedEvents([])('counter', ['increment']);
type MyEvent = Event<EM, 'counter', 'increment'>;
```

**Note :** Tous les alias dépréciés ont été supprimés. Si vous effectuez une mise à niveau depuis la v0.4.x, vous devez mettre à jour votre code pour utiliser la nouvelle terminologie event-bus.

---

## Contribuer

Nous accueillons les contributions ! Voir :

- [Racine du Monorepo](.https://github.com/quojs/quojs/blob/main/docs/fr/README.md)
- [Guide de Contribution](.https://github.com/quojs/quojs/blob/main/docs/fr/CONTRIBUTING.md)
- [Code de Conduite](.https://github.com/quojs/quojs/blob/main/docs/fr/CODE_OF_CONDUCT.md)

---

## Statut

**Release Candidate** — Les APIs sont stables, utilisées en production, changements mineurs
possibles avant la v1.0.

---

## Licence

**MIT** — Libre d'utilisation dans les projets commerciaux et open source.

---

Fait au 🇲🇽 pour le monde.
