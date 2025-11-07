![Quo.js logo](https://quojs.dev/assets/logo.svg)

# Quo.js

> [ 🇲🇽 Versión en Español](https://github.com/quojs/quojs/blob/main/docs/es/README.md)&nbsp; |
> &nbsp;[ 🇵🇹 Versão Portuguesa](https://github.com/quojs/quojs/blob/main/docs/pt/README.md)&nbsp; | &nbsp;
> [ 🇺🇸 English Version](https://github.com/quojs/quojs/blob/main/README.md)&nbsp; | &nbsp; 👉 [ 🇫🇷 Version française](https://github.com/quojs/quojs/blob/main/docs/fr/README.md)

![Bundle size](https://badgen.net/bundlephobia/min/@quojs/core)
![Bundle size](https://badgen.net/bundlephobia/minzip/@quojs/core)
![Bundle size](https://badgen.net/bundlephobia/tree-shaking/@quojs/core)
![Bundle size](https://badgen.net/bundlephobia/dependency-count/@quojs/core)
![npm downloads](https://badgen.net/npm/dm/@quojs/core)
![License](https://img.shields.io/npm/l/@quojs/core)

Déclaratif • Ultra-simple • Expressif : Quo.js est une bibliothèque moderne de gestion d'état
inspirée de Redux—mais sans le bagage de Redux Toolkit. Elle ramène la simplicité et la
puissance du pattern Redux original tout en introduisant **canaux + événements**, **middleware
asynchrone natif & effets**, **abonnements granulaires**, et **hooks React prêts pour Suspense
et le Mode Concurrent**.

## Packages

- **[@quojs/core](https://github.com/quojs/quojs/blob/main/packages/core/README.fr.md)** — Store central, reducers, middleware, effets
  (indépendant du framework)
- **[@quojs/react](https://github.com/quojs/quojs/blob/main/packages/react/README.fr.md)** — Provider React & hooks (prêt pour
  Suspense/Concurrent)


## [Examples Exécutables](https://github.com/quojs/quojs/tree/main/packages)

| Example                                                                                | Description                                                                                                             | Screenshot                                                                    |
| -------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| **[Quo.js dans React](https://github.com/quojs/quojs/blob/main/examples/v0/quojs-in-react/README.fr.md)**                          | Une application TODO simple (consultez l'article [comparatif React Profiler](https://github.com/quojs/quojs/blob/main/examples/v0/quojs-in-react/redux-quojs-profiler.fr.md)) | ![Quo.js logo](https://quojs.dev/assets/examples/profiler-quojs-frame-15.png) |
| **[Logo cinétique de Quo.js (React + SVG)](https://github.com/quojs/quojs/blob/main/examples/v0/quojs-kinetic-logo/README.fr.md)** | Un logo cinétique composé d'environ 1 500 cercles SVG, animé par un petit moteur de simulation et synchronisé avec une boutique Quo.js | ![Quo.js logo](https://quojs.dev/assets/examples/quojs-dots.gif)              |

## Pourquoi Quo.js ?

- 🗪 **Modèle Canal + Événement** — les actions sont `{ channel, event, payload }` ; les reducers
  s'abonnent exactement à la granularité dont vous avez besoin.
- 🎯 **Abonnements à grain fin** — abonnez-vous à des props atomiques pour éviter les
  [**rendus inutiles**](https://github.com/quojs/quojs/blob/main/examples/v0/quojs-in-react/redux-quojs-profiler.fr.md).
- 🧭 **TypeScript d'abord** — typages ergonomiques et APIs prévisibles.
- ⚡ **Middleware & effets intégrés** — asynchrone par défaut ; sans boilerplate thunk/saga.
- 🧩 **Reducers dynamiques** — ajoutez/supprimez des reducers à l'exécution.
- 📌 **Léger** — surface petite et ciblée.
- 🧭 **Indépendant du framework** — React aujourd'hui ; plus d'adaptateurs bienvenus.

## Comment **Quo.js** se compare-t-il aux autres conteneurs d'état ?

Lors de l'évaluation d'un gestionnaire d'état, la surface brute de l'API n'est pas toute
l'histoire. Ce qui compte le plus, c'est la philosophie qui la sous-tend, les compromis qu'elle
fait, et comment ces choix affectent **l'expérience développeur, les performances et
l'évolutivité** dans les projets réels.

Quo.js a été conçu comme une évolution pragmatique des idées originales de Redux : événements
explicites, transitions d'état prévisibles, typage fort TypeScript, et gestion intégrée
async/effets — sans la "magie" cachée ou le boilerplate d'autres écosystèmes.

Pour vous aider à décider si Quo.js est le bon choix, nous avons préparé des comparaisons
directes avec d'autres bibliothèques populaires. Chaque document explore :

- **Modèle conceptuel** (comment l'état circule à travers les actions, reducers et effets)
- **Ergonomie développeur** (boilerplate, typage, outils de débogage)
- **Performance** (granularité des abonnements, efficacité du rendu)
- **Async & effets** (comment les workflows et effets secondaires sont exprimés)
- **Intégration React** (sélecteurs, Suspense, préparation au mode concurrent)

👉 Consultez les comparaisons [ici](https://github.com/quojs/quojs/blob/main/examples/v0/quojs-in-react/redux-quojs-profiler.fr.md)

## Démarrage Rapide (Monorepo)

```bash
npm i -g @microsoft/rush
rush install
rush build
rush test
```

Builds ciblés :

```bash
rush build --to @quojs/core
rush build --from @quojs/react
```

Consultez le **Guide du Développeur** pour le SDLC, la mise en cache et les releases :

- [Guide du Développeur](https://github.com/quojs/quojs/blob/main/docs/fr/DEVELOPER_GUIDE.md)

## Documentation

### Core

- [TypeDoc](https://github.com/quojs/quojs/blob/main/packages/core/docs/README.md) : documentation plus technique extraite avec
  TypeDoc.
- [Docs Développeur (WIP)](https://www.quojs.dev/?lang=fr) : guide de démarrage rapide,
  tutoriel, recettes, etc.

### Bindings React

- [TypeDoc](https://github.com/quojs/quojs/blob/main/packages/react/docs/README.md) : documentation plus technique extraite avec
  TypeDoc.
- [Docs Développeur (WIP)](https://www.quojs.dev/?lang=fr) : guide de démarrage rapide,
  tutoriel, recettes, etc.

## Contribuer

- Commencez ici — [Guide de Contribution](https://github.com/quojs/quojs/blob/main/docs/fr/CONTRIBUTING.md)
- [Code de Conduite](https://github.com/quojs/quojs/blob/main/docs/fr/CODE_OF_CONDUCT.md)
- [Gouvernance](https://github.com/quojs/quojs/blob/main/docs/fr/GOVERNANCE.md)
- [Mainteneurs](https://github.com/quojs/quojs/blob/main/docs/fr/MAINTAINERS.md)
- [Sécurité](https://github.com/quojs/quojs/blob/main/docs/fr/SECURITY.md)
- [Marques Déposées](https://github.com/quojs/quojs/blob/main/docs/fr/TRADEMARKS.md)

## Statut

Quo.js est en **version candidate**. Les API sont stables et **susceptibles d'évoluer**, les types sont stricts et le framework est utilisé en production.

Vos commentaires et contributions sont les bienvenus.

Fabriqué au 🇲🇽, pourle monde.
