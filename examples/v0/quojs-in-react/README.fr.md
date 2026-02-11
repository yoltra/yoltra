# Quo.js vs Redux Toolkit – Démo React Vite

> [ 🇲🇽 Versión en Español](./README.es.md)&nbsp; | &nbsp;[ 🇵🇹 Versão Portuguesa](./README.pt.md)&nbsp; | &nbsp;[ 🇺🇸 English Version](./README.md)&nbsp;

Une petite demo React ciblee qui heberge **les deux implementations d'etat** cote a cote :

- **Quo.js** (store pilote par evenements avec evenements par canaux et abonnements fins aux chemins)
- **Redux Toolkit (RTK)** (stack Redux standard avec `createSlice` + `createAsyncThunk`)

La comparaison des flamegraphs est la preuve : Quo.js ne re-rend que les composants dont les chemins souscrits ont change, tandis que Redux re-rend chaque selecteur a chaque dispatch. Utilisez ce projet pour executer l'interface utilisateur localement et reproduire l'**[Analyse du Profiler React](./redux-quojs-profiler.fr.md)**.

## Structure du projet

Les deux implémentations exposent la même interface utilisateur et les mêmes flux utilisateur
(lister, ajouter, mettre à jour, supprimer). L'application de comparaison monte chaque page sous
des routes séparées afin que vous puissiez les profiler de manière isolée.

- Route **/quojs** → Page Quo.js enveloppée dans son propre provider
- Route **/rtk** → Page RTK enveloppée dans son propre provider

L'application est un projet **Vite** qui se trouve dans un monorepo **Rush**.

## Prérequis

- **Node.js** : LTS recommandé (par ex. 18.x).
- **pnpm** : utilisé par Rush pour la gestion des dépendances
  ```bash
  npm i -g pnpm
  ```
- **Rush** (CLI global)
  ```bash
  npm i -g @microsoft/rush
  ```

## Cloner et initialiser

Clonez ce dépôt, puis naviguez vers le dossier du dépôt et exécutez les commandes suivantes dans
le terminal :

```bash

# Installer toutes les dépendances du monorepo
rush install          # ou : rush update

# (optionnel) Tout construire
rush build
```

## Exécuter l'application (développement)

L'application de comparaison est une application Vite qui route vers chaque implémentation.

```bash
cd examples/quojs-in-react
rushx dev             # identique à : pnpm dev
```

Ouvrez **http://localhost:5173** (ou ce que Vite affiche).

- Visitez **/quojs** pour la page Quo.js.
- Visitez **/rtk** pour la page RTK.

## Build de production et aperçu (pour des chiffres de profiling stables)

Les builds de développement incluent des vérifications supplémentaires (par ex., effets du Mode
Strict de React et transformations de développement). Pour des temps plus stables, profilez un
build de **production** :

```bash
cd examples/quojs-in-react
rushx build           # Build de production Vite
rushx preview         # Sert le build de production
# par défaut : http://localhost:4173
```

Puis ouvrez `/quojs` ou `/rtk` sur le serveur d'aperçu.

## Utiliser le Profiler React

1. **Installez React DevTools** dans votre navigateur (Chrome/Edge/Firefox).
2. Ouvrez votre application, puis ouvrez DevTools → onglet **Profiler**.
3. Dans la barre d'outils du Profiler :
   - Activez **"Record profiling"**.
   - Appuyez sur `Refresh` pour que le profiler capture également l'étape de chargement
   - (Optionnel) Activez _"Record why each component rendered"_ pour des informations plus
     riches.
4. Interagissez avec la page pour capturer des frames spécifiques :
5. Inspectez le flamegraph pour chaque commit :
   - Quels composants ont été re-rendus ?
   - Combien de temps a pris le commit ?
   - Quelle partie de l'arbre a été invalidée ?

### Exporter des profils

Dans le Profiler, cliquez sur **Save profile…** pour exporter un `.json` que vous pouvez
conserver pour la reproductibilité.

## Source de données

L'exemple de fetch utilise MSW avec des données simulées de
`https://jsonplaceholder.typicode.com/todos?id=0` par défaut. Vous pouvez modifier cela dans les
actions/hooks si nécessaire. L'accès réseau n'est pas requis par défaut et doit être autorisé
par votre navigateur / proxy de développement si vous désactivez MSW.

## Licence

Cette démo est à des fins de comparaison/documentation. Consultez la racine du dépôt pour les
détails de la licence.
