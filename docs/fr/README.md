![Quo.js logo](https://quojs.dev/assets/logo.svg)

# Quo.js

> [ 🇲🇽 Versión en Español](https://github.com/quojs/quojs/blob/main/docs/es/README.md)&nbsp;
> |&nbsp;[ 🇵🇹 Versão Portuguesa](https://github.com/quojs/quojs/blob/main/docs/fr/README.md)&nbsp;
> |&nbsp;[ 🇺🇸 English Version](https://github.com/quojs/quojs/blob/main/README.md)&nbsp;
> |&nbsp; 👉 [ 🇫🇷 Version française](https://github.com/quojs/quojs/blob/main/docs/fr/README.md)

![Taille du bundle](https://badgen.net/bundlephobia/min/@quojs/core)
![Taille du bundle](https://badgen.net/bundlephobia/minzip/@quojs/core)
![Taille du bundle](https://badgen.net/bundlephobia/tree-shaking/@quojs/core)
![Taille du bundle](https://badgen.net/bundlephobia/dependency-count/@quojs/core)
![Téléchargements npm](https://badgen.net/npm/dm/@quojs/core)
![Licence](https://img.shields.io/npm/l/@quojs/core)

**Gestion d'état basée sur les événements avec des abonnements atomiques.** Quo.js est un
conteneur d'état moderne, async-first qui combine **des événements basés sur des canaux**, **une
réactivité à granularité fine** et **un support natif pour async**—sans la complexité de Redux
Toolkit ou la magie implicite de MobX.

---

## Qu'est-ce que Quo.js ?

Quo.js est un **conteneur d'état basé sur les événements, async-first** conçu pour résoudre
trois problèmes fondamentaux :

### 1. **Performance : Zéro Re-rendus Inutiles**

Les bibliothèques d'état traditionnelles re-rendent les composants lorsque _n'importe quelle_
partie de l'état souscrit change. Quo.js utilise **des abonnements atomiques de chemin** pour
éliminer ce gaspillage.

```tsx
// ❌ Redux/Zustand : Re-rend lorsque N'IMPORTE QUELLE tâche change
const todos = useSelector((state) => state.todos);

// ✅ Quo.js : Re-rend uniquement lorsque le titre de CETTE tâche spécifique change
const title = useAtomicProp({
  reducer: "todos",
  property: "items.0.title",
});
```

[Voir la comparaison des flamegraphs →](https://github.com/quojs/quojs/blob/main/examples/v0/quojs-in-react/redux-quojs-profiler.fr.md)

### 2. **Complexité Asynchrone : Intégrée, Pas Ajoutée**

Quo.js traite l'asynchrone comme une préoccupation de première classe. Les middlewares et effets
sont `async` par défaut—pas de thunks, pas de sagas, pas de cérémonies.

```typescript
// Middleware asynchrone intégré
const middleware = async (state, event, emit) => {
  if (event.type === "fetchUser") {
    const user = await fetch("/api/user").then((r) => r.json());
    await emit("user", "loaded", user);
  }
  return true;
};
```

### 3. **Organisation : Événements Basés sur des Canaux**

Les événements sont organisés par namespace via des canaux `(channel, type, payload)`, évitant
les collisions de noms dans les grandes applications.

```typescript
emit("auth", "login", credentials);     // Événements d'authentification
emit("analytics", "track", event);      // Événements d'analytics
emit("ui", "toast", message);           // Événements d'UI
```

---

## Fonctionnalités Principales

- 🎯 **Abonnements Atomiques** — Abonnez-vous à des chemins d'état exacts ; ne re-rend que
  lorsqu'ils changent
- ⚡ **Async-First** — Middleware + effets async natifs ; aucun thunk/saga requis
- 🗪 **Basé sur les Événements** — Événements basés sur des canaux avec garanties d'ordre FIFO
- 🛡️ **TypeScript-First** — Excellente inférence de types et autocomplétion
- 🧩 **Reducers Dynamiques** — Ajoutez/supprimez des slices d'état à l'exécution
- 🌍 **Agnostique du Framework** — Nous supportons React maintenant, et nous supporterons
  d'autres à l'avenir
- 📌 **Léger** — ~15KB au total (@quojs/core + @quojs/react)

---

## Packages

- **[@quojs/core](https://github.com/quojs/quojs/blob/main/packages/core/README.fr.md)** — Store
  principal, reducers, middleware, effects (agnostique du framework)
- **[@quojs/react](https://github.com/quojs/quojs/blob/main/packages/react/README.fr.md)** —
  Hooks React et provider (compatible Suspense/Concurrent)

---

## Guide de Démarrage Rapide

- [Guide de démarrage rapide de @quojs/core](https://github.com/quojs/quojs/blob/main/docs/fr/QUICK_START_GUIDE.md).

---

## Exemples en Direct

| Exemple                                                                                                                     | Description                                                                                                                                                                      | Capture d'écran                                                                 |
| --------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| **[Application de Tâches avec Profiler](https://github.com/quojs/quojs/blob/main/examples/v0/quojs-in-react/README.fr.md)** | Application de tâches comparant les performances Redux vs Quo.js ([flamegraphs](https://github.com/quojs/quojs/blob/main/examples/v0/quojs-in-react/redux-quojs-profiler.fr.md)) | ![Profiler](https://quojs.dev/assets/examples/profiler-quojs-frame-15.png)      |
| **[Logo Cinétique (900 particules)](https://github.com/quojs/quojs/blob/main/examples/v0/quojs-kinetic-logo/README.fr.md)** | ~1500 cercles SVG pilotés par simulation physique + état Quo.js                                                                                                                  | ![Logo](https://quojs.dev/assets/examples/quojs-dots.gif)                       |
| **[Sélecteur de Thème Next.js 15](https://github.com/quojs/quojs/blob/main/examples/v0/quojs-in-nextjs/README.fr.md)**      | Sélecteur de thème dans Next.js 15 App Router (React 19 + Quo.js)                                                                                                                | ![Thème](https://quojs.dev/assets/examples/quojs-in-nextjs--theme-switcher.png) |

---

## Comment Quo.js se Compare-t-il ?

Quo.js occupe un espace unique entre la structure de Redux et la simplicité de Zustand :

| Bibliothèque      | Architecture        | Support Async    | Abonnements       | Taille du Bundle |
| ----------------- | ------------------- | ---------------- | ----------------- | ---------------- |
| **Redux Toolkit** | Centralisé          | Thunks/RTK Query | Niveau slice      | ~45KB            |
| **Zustand**       | Centralisé          | Manuel           | Niveau sélecteur  | ~1KB             |
| **Jotai**         | Distribué (atomes)  | Manuel           | Niveau atome      | ~3KB             |
| **MobX**          | Observable          | `runInAction`    | Niveau observable | ~16KB            |
| **XState**        | Machines d'État     | Intégré          | Niveau état       | ~30KB            |
| **Quo.js**        | Basé sur événements | **Intégré**      | **Niveau chemin** | ~15KB            |

**Différenciateurs Clés :**

- ✅ Abonnements à granularité fine **par défaut** (sans optimisation manuelle)
- ✅ Pipeline async natif (middleware + effects)
- ✅ Garanties d'ordre des événements (file FIFO)

👉
**[Lire la comparaison complète →](https://github.com/quojs/quojs/blob/main/docs/fr/design/state-management-library-comparison.md)**

---

## Quand Devriez-vous Utiliser Quo.js ?

### ✅ Excellent Pour

- Les applications où la **performance** (optimisation du re-rendu) est critique
- Les projets qui ont besoin de **modèles async natifs** (sans thunks/sagas)
- Les **grandes bases de code** où l'organisation par canaux prévient les collisions
- Les **applications universelles** (web + serveurs/microservices Node.js)
- Les équipes qui veulent un **flux d'événements explicite** pour le débogage

### ⚠️ Envisagez des Alternatives Si

- Vous avez besoin d'une **taille de bundle minimale** (<5KB) → Essayez Zustand
- Votre équipe est **fortement investie dans Redux** → Essayez Redux Toolkit
- Vous préférez un **état basé sur les atomes** → Essayez Jotai
- Vous modélisez des **flux de travail complexes** → Essayez XState

---

## Installation et Configuration

### 1. Installer les Packages

```bash
npm install @quojs/core @quojs/react
# ou
yarn add @quojs/core @quojs/react
# ou
pnpm add @quojs/core @quojs/react
```

### 2. Définissez Votre Carte d'Événements

```typescript
// types.ts
export type AppEM = {
  todos: {
    add: { id: string; title: string };
    toggle: { id: string };
    delete: { id: string };
  };
  ui: {
    setTheme: "light" | "dark";
  };
};
```

### 3. Créez le Store

```typescript
// store.ts
import { createStore } from "@quojs/core";
import type { AppEM } from "./types";

export const store = createStore({
  name: "MyApp",
  reducer: {
    todos: {
      state: { items: [] },
      events: [
        ["todos", "add"],
        ["todos", "toggle"],
        ["todos", "delete"],
      ],
      reducer: (state, event) => {
        // Votre logique de reducer
      },
    },
  },
});
```

### 4. Utilisez dans React

```tsx
// App.tsx
import { StoreProvider } from "@quojs/react";
import { store } from "./store";

function App() {
  return (
    <StoreProvider store={store}>
      <YourApp />
    </StoreProvider>
  );
}
```

---

## Documentation

- **[Guide de Démarrage Rapide](https://github.com/quojs/quojs/blob/main/docs/fr/QUICK_START_GUIDE.md)**
  — Commencez en 5 minutes
- **[Référence API (@quojs/core)](https://github.com/quojs/quojs/blob/main/packages/core/docs/README.md)**
  — TypeDoc pour le package core (English)
- **[Référence API (@quojs/react)](https://github.com/quojs/quojs/blob/main/packages/react/docs/README.md)**
  — TypeDoc pour les hooks React (English)
- **[Comparaison des Bibliothèques](https://github.com/quojs/quojs/blob/main/docs/fr/design/state-management-library-comparison.md)**
  — Comment Quo.js se compare à Redux, Zustand, Jotai, etc.
- **[Architecture de File d'Événements](https://github.com/quojs/quojs/blob/main/docs/fr/design/event-queue-architecture.md)**
  — Analyse technique approfondie

---

## Contribuer

Nous accueillons les contributions ! Veuillez lire :

- [Guide de Contribution](https://github.com/quojs/quojs/blob/main/docs/fr/CONTRIBUTING.md)
- [Code de Conduite](https://github.com/quojs/quojs/blob/main/docs/fr/CODE_OF_CONDUCT.md)
- [Gouvernance](https://github.com/quojs/quojs/blob/main/docs/fr/GOVERNANCE.md)
- [Mainteneurs](https://github.com/quojs/quojs/blob/main/docs/fr/MAINTAINERS.md)
- [Politique de Sécurité](https://github.com/quojs/quojs/blob/main/docs/fr/SECURITY.md)

---

## Développement (Monorepo)

```bash
# Installez Rush globalement
npm i -g @microsoft/rush

# Installez les dépendances
rush install

# Construisez tous les packages
rush build

# Exécutez les tests
rush test

# Construisez un package spécifique
rush build --to @quojs/core

# Construisez à partir d'un package spécifique
rush build --from @quojs/react
```

Consultez le
**[Guide du Développeur](https://github.com/quojs/quojs/blob/main/docs/fr/DEVELOPER_GUIDE.md)**
pour plus de détails.

---

## Statut

Quo.js est au stade **Release Candidate** :

- ✅ Les APIs sont stables (terminologie v0.5.0 finalisée)
- ✅ Les types TypeScript sont stricts et complets
- ✅ Utilisé dans des applications en production
- ⚠️ Les APIs mineures peuvent encore évoluer avant la v1.0

**Les retours et PRs sont les bienvenus !**

---

## Licence

**MIT** — Libre d'utilisation dans les projets commerciaux et open source.

Consultez [LICENSE](https://github.com/quojs/quojs/blob/main/LICENSE) pour plus de détails.

---

## Communauté

- Visitez le **[site officiel de Quo.js](https://quojs.dev/?lang=fr)**
- **Twitter/X :** [@quojs_dev](https://twitter.com/quojs_dev)
- **GitHub Discussions :**
  [Rejoignez la conversation](https://github.com/quojs/quojs/discussions)
- **Issues :**
  [Signalez des bugs ou demandez des fonctionnalités](https://github.com/quojs/quojs/issues)

---

Fait au 🇲🇽 pour le monde.
