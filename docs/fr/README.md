# Quo.js

![Quo.js logo](../../assets/logo.svg)

Déclaratif • Ultra-simple • Expressif : Quo.js est une bibliothèque moderne de gestion d'état
inspirée de Redux—mais sans le bagage de Redux Toolkit. Elle ramène la simplicité et la
puissance du pattern Redux original tout en introduisant **canaux + événements**, **middleware
asynchrone natif & effets**, **abonnements granulaires**, et **hooks React prêts pour Suspense
et le Mode Concurrent**.

> [ 🇲🇽 Versión en Español](../es/README.md)&nbsp; |
> &nbsp;[ 🇵🇹 Versão Portuguesa](../pt/README.md)&nbsp; |
> &nbsp;[ 🇺🇸 English Version](../../README.md)&nbsp; | &nbsp; 👉
> [ 🇫🇷 Version française](./README.md)

## Packages

- **[@quojs/core](./packages/core/README.fr.md)** — Store central, reducers, middleware, effets
  (indépendant du framework)
- **[@quojs/react](./packages/react/README.fr.md)** — Provider React & hooks (prêt pour
  Suspense/Concurrent)
- **[examples/](./examples/)** — exemples exécutables

## Pourquoi Quo.js ?

- 🗪 **Modèle Canal + Événement** — les actions sont `{ channel, event, payload }` ; les reducers
  s'abonnent exactement à la granularité dont vous avez besoin.
- 🎯 **Abonnements à grain fin** — abonnez-vous à des props atomiques pour éviter les
  [**rendus inutiles**](./examples/v0/quojs-in-react/redux-quojs-profiler.fr.md).
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

👉 Consultez les comparaisons [ici](./examples/v0/quojs-in-react/redux-quojs-profiler.fr.md)

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

- [Guide du Développeur](./DEVELOPER_GUIDE.md)

## Documentation

### Core

- [TypeDoc](./packages/core/docs/en/README.md) : documentation plus technique extraite avec
  TypeDoc.
- [Docs Développeur (WIP)](https://www.quojs.dev/?lang=fr) : guide de démarrage rapide,
  tutoriel, recettes, etc.

### Bindings React

- [TypeDoc](./packages/react/docs/en/README.md) : documentation plus technique extraite avec
  TypeDoc.
- [Docs Développeur (WIP)](https://www.quojs.dev/?lang=fr) : guide de démarrage rapide,
  tutoriel, recettes, etc.

## Contribuer

- Commencez ici — [Guide de Contribution](./CONTRIBUTING.md)
- [Code de Conduite](./CODE_OF_CONDUCT.md)
- [Gouvernance](./GOVERNANCE.md)
- [Mainteneurs](./MAINTAINERS.md)
- [Sécurité](./SECURITY.md)
- [Marques Déposées](./TRADEMARKS.md)

## Statut

Quo.js est en **phase RC**. Les APIs sont stables, les types sont stricts, et il est utilisé en
production. Les retours et PRs sont les bienvenus.

Fabriqué au 🇲🇽, pourle monde.
