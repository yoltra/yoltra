![Quo.js logo](https://quojs.dev/assets/logo.svg)

# Quo.js dans Next.js (React 19)

> [ 🇲🇽 Versión en Español](./README.es.md)&nbsp; |
> &nbsp;[ 🇵🇹 Versão Portuguesa](./README.pt.md)&nbsp; |
> &nbsp;[ 🇺🇸 English Version](./README.md)&nbsp; | &nbsp; 👉 [ 🇫🇷 Version française](./README.fr.md)

Un exemple minimal montrant comment **[Quo.js](https://quojs.dev)** — le conteneur d’état déclaratif et centré sur TypeScript — peut fonctionner **à l’intérieur d’une application Next.js (App Router)**, y compris avec des composants client compatibles SSR.

Cette démo implémente un simple **commutateur de thème** (clair ↔ sombre) propulsé par `@quojs/core` et `@quojs/react`, prouvant que Quo.js peut gérer l’état d’une application sans friction dans **React 19 + Next.js 16**.

---

## 🎯 Objectif

Cet exemple a été conçu pour :

- ✅ Démontrer que **Quo.js fonctionne avec le SSR de Next.js** (Server-Side Rendering)  
- ⚡ Mettre en avant les **abonnements atomiques** — l’UI ne met à jour que les composants concernés  
- 🌗 Implémenter un **système de thèmes** à l’aide des reducers et sélecteurs atomiques de Quo.js  

---

## 🧠 Vue d’Ensemble du Concept

L’application définit un `themeReducer` avec deux événements :

| Événement | Objectif |
|:--|:--|
| `theme.set` | Définit le thème préféré (`light`, `dark` ou `system`) |
| `theme.resolve` | Résout le thème effectif selon la préférence du système |

Le thème sélectionné est appliqué à `document.documentElement.classList` (`theme-light` / `theme-dark`) et maintenu de manière réactive grâce à la **souscription atomique** de Quo.js via `useAtomicProp`.

---

## 📂 Structure

```
quojs-in-nextjs/
├── src/
│   ├── components/
│   │   ├── Head.component.tsx
│   │   ├── Header.component.tsx
│   │   └── Content.component.tsx
│   ├── context/
│   │   └── Store.context.ts
│   ├── state/
│   │   ├── theme/Theme.reducer.ts
│   │   ├── hooks.ts
│   │   ├── store.ts
│   │   └── types.ts
│   └── pages/
│       └── index.tsx
└── package.json
```

---

## ⚙️ Comment Exécuter

D’abord, installez les dépendances :

```bash
rush update
```

Ensuite, ouvrez un terminal dans ce dossier et exécutez :

```bash
rush dev
```

Ouvrez [http://localhost:3000](http://localhost:3000) dans votre navigateur pour voir le résultat.

### 3. Changer de Thème

Cliquez sur l’icône 🌙 / 🌞 dans l’en-tête pour basculer entre le mode clair et le mode sombre.  
Le changement est géré par **Quo.js** via une mise à jour atomique de propriété.