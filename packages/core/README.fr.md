![Logo Quo.js](../../assets/logo.svg)

# Quo.js L'état des choses, réécrit.

> [ 🇲🇽 Versión en Español](./README.es.md)&nbsp; |
> &nbsp;[ 🇵🇹 Versão Portuguesa](./README.pt.md)&nbsp; |
> &nbsp;[ 🇺🇸 English Version](./README.md)&nbsp; | &nbsp; 👉
> [ 🇫🇷 Version française](./README.fr.md)

**@quojs/core** es una biblioteca moderna de gestión de estado, **agnóstica de framework** e
inspirada en Redux — pero sin el peso de Toolkit. Introduisez **canaux + événements**,
**middleware et effets asynchrones natifs**, et **abonnements atomiques**.

> Fonctionne dans les **navigateurs et dans Node**. Ne prend pas en charge DOM. Adapté pour Node
> 18+, Bun et Deno (avec ESM).

## Installation

```bash
npm i @quojs/core
```

## Pourquoi Quo.js ?

- 🔗 **Modèle Canal + Événement** — `{ canal, événement, charge utile }` pour une modularité
  naturelle
- 🎯 **abonnements atomiques** — suivi atomique des changements
- ⚡ **Middleware et effets asynchrones** — intégrés, sans _thunk/saga_
- 🛡 **TypeScript d'abord** — types ergonomiques et prévisibles
- 🧩 **Réducteurs dynamiques** — ajoute/supprime des réducteurs en temps d'exécution
- 🧭 **Agnostique de framework** — utilisez-le avec `@quojs/react` ou sans interface utilisateur
  dans Node

## Docs

- [Développeur](https://quojs.dev/?lang=fr) : guide de démarrage rapide, tutoriel, gists, etc.
- [TypeDoc](./docs/fr/README.md) : une documentation plus technique extraite à l'aide de
  TypeDoc.

## Liens

- [Monorepo](../../docs/fr/README.md)
- [Gouvernance](../../docs/fr/GOVERNANCE.md)
- [Code de conduite](../../docs/fr/CODE_OF_CONDUCT.md)
- [Guide de contribution](../../docs/fr/CONTRIBUTING.md)

## État

Phase RC. APIs stables (potentiellement changeantes), types stricts, utilisation en production.
Les commentaires et les pull requests sont les bienvenus.

Fait avec ❤️ au 🇲🇽 pour le monde.
