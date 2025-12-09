# Liaisons React pour Quo.js

> [ 🇲🇽 Versión en Español](./README.es.md)&nbsp; |
> &nbsp;[ 🇵🇹 Versão Portuguesa](./README.pt.md)&nbsp; |
> &nbsp;[ 🇺🇸 English Version](./README.md)&nbsp; | &nbsp; 👉
> [ 🇫🇷 Version française](./README.fr.md)

![Bundle size](https://badgen.net/bundlephobia/min/@quojs/react)
![Bundle size](https://badgen.net/bundlephobia/minzip/@quojs/react)
![Bundle size](https://badgen.net/bundlephobia/tree-shaking/@quojs/react)
![Bundle size](https://badgen.net/bundlephobia/dependency-count/@quojs/react)
![npm version](https://badgen.net/npm/v/@quojs/react)
![npm downloads](https://badgen.net/npm/dm/@quojs/react)
![License](https://badgen.net/npm/license/@quojs/react)

Extension officielle **React** pour **Quo.js**, un conteneur d’état prévisible qui redonne vie à
la simplicité de Redux classique tout en ajoutant :

- **Canaux + événements** à la place des types d’action
- **Middleware asynchrones natifs** et **effets**, sans la cérémonie des thunks/sagas
- **Abonnements précis** à des chemins pointés ou à des motifs génériques (wildcards)
- **Garanties d’immuabilité** avec gel profond (`deep-freeze`) et détection fine des changements
- Une surface d’API réduite et explicite, facile à raisonner

Ce package fournit :

- `<StoreProvider>` pour placer un store **Quo.js** dans le contexte React
- Hooks :
  - `useStore`, `useDispatch`, `useSelector`
  - `useAtomicProp` et `useAtomicProps` pour des re-rendus **granulaires**
  - `useSuspenseAtomicProp` et `useSuspenseAtomicProps` pour les flux de données **Suspense**
  - Aides pour le cache de Suspense : `invalidateAtomicProp`, `invalidateAtomicPropsByReducer`,
    `clearSuspenseCache`

## Installation

Installez **Quo.js** et ses liaisons React :

```bash
npm i @quojs/core @quojs/react
# ou
yarn add @quojs/core @quojs/react
# ou
pnpm add @quojs/core @quojs/react
```

Dépendances requises : `react` et `react-dom` (React 18+).  
TypeScript est recommandé.

## Démarrage rapide

### Configuration du Store

Suivez l’exemple de **Quo.js** sur  
[comment créer un Store](https://quojs.dev/?lang=en).

### Contexte AppStore

Utilisez `React Context` pour exposer le store à votre application :

```tsx
// fichier : ./context/QuoStoreContext.ts
import { createContext } from "react";
import type { AppStore } from "store.ts";

export const QuoStoreContext = createContext<AppStore | null>(null);
```

### Configuration des Hooks

Créez et exportez des hooks typés pour votre application :

```tsx
import { createQuoHooks } from "@quojs/react";

import { QuoStoreContext } from "./context/QuoStoreContext.ts";
import type { AppAM, AppState } from "./types"; // <-- récupérez-les à l’étape de création du Store

export const {
  useStore,
  useDispatch,
  useSelector,
  useAtomicProp,
  useAtomicProps,
  shallowEqual,
} = createQuoHooks<keyof AppState & string, AppState, AppAM>(QuoStoreContext);
```

Enveloppez votre application dans le provider Quo :

```tsx
import React from "react";
import { createRoot } from "react-dom/client";

import { QuoStoreContext } from "./context/QuoStoreContext.ts";
import { store, type AppStore } from "store.ts";

import { App } from "./App";

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QuoStoreContext.Provider value={store}>
      <App />
    </StoreProvider>
  </React.StrictMode>
);
```

Lisez et mettez à jour l’état depuis React à l’aide des hooks :

```tsx
import React from "react";
import { useDispatch, useAtomicProp } from "@quojs/react";

export function Atomic() {
  // Granulaire : ne se re-rend que lorsque "counter.value" change réellement
  const value = useAtomicProp({
    reducer: "count",
    property: "value",
  });

  return <h1>Compteur : {value}</h1>;
}

export function App() {
  const dispatch = useDispatch<any>();

  return (
    <div>
      <Atomic />
      <button onClick={() => dispatch("count", "subtract", 1)}>-1</button>
      <button onClick={() => dispatch("count", "add", 1)}>+1</button>
      <button onClick={() => dispatch("count", "set", 0)}>Réinitialiser</button>
    </div>
  );
}
```

Et voilà. Aucun boilerplate d’actions, aucun sélecteur, aucun thunk.  
Vous modélisez les événements directement et reliez les reducers à `(channel, event)`.

## Documentation

- [Documentation développeur](https://quojs.dev/?lang=fr) : guide de démarrage rapide,
  tutoriels, recettes, etc.
- [TypeDoc](./docs/README.md) : documentation technique extraite avec TypeDoc (en Anglais).
