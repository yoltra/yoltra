![Quo.js logo](../../assets/logo.svg)

# Guide du développeur (Monorepo Quo.js)

> [ 🇲🇽 Versión en Español](../es/DEVELOPER_GUIDE.md)&nbsp; |
> &nbsp;[ 🇵🇹 Versão Portuguesa](../pt/DEVELOPER_GUIDE.md)&nbsp; |
> &nbsp;[ 🇺🇸 English Version](../../DEVELOPER_GUIDE.md)&nbsp; |
> &nbsp; 👉 [ 🇫🇷 Version française](./DEVELOPER_GUIDE.md)

Source unique de vérité pour le SDLC, la configuration locale, la gestion des branches, les
tests/couverture et les releases en utilisant **Rush + PNPM**.

## SDLC (comment nous livrons)

1. Planifier → ouvrir/trier un problème (bug/fonctionnalité).
2. Branche → `feature/<issue>-<slug>` ou `fix/<issue>-<slug>`.
3. Code → tests + docs ; **Conventional Commits** avec signature **DCO**.
4. Portes locales → `rush build` et `rush test` passent; couverture ≥ seuils.
5. PR → remplir le modèle de PR ; lier les problèmes ; la CI doit être verte (**fichiers
   modifiés** vérifiés).
6. Revue → approbations ; écraser ou rebaser selon l'appel du mainteneur.
7. Publication → les mainteneurs exécutent `rush version` puis `rush publish` (voir «
   Publications » ci-dessous).

## Configuration locale

Installer Rush (une seule fois):

```bash
npm i -g @microsoft/rush
```

Installer les dépendances (déterministe via PNPM + Rush):

```bash
rush install
```

Construire tout (conscient du graphe, incrémental ; utilise le cache de construction de Rush):

```bash
rush build
```

Exécuter les tests pour tous les packages (définis via command-line.json):

test rapide

Lint tous les packages qui définissent un script "lint":

```bash
rush lint
```

La concentration se construit:

```bash
rush build --to @quojs/core
rush build --from @quojs/react
```

Travail au niveau du package:

cd packages/quojs

rushx build rushx test rushx lint

## Stratégie de branchement

- Branche par défaut: `main`.
- Le travail se fait sur les branches `feature/*` ou `fix/*`.
- Ouvrez des PR contre `main`.
- Chaque PR qui modifie un package publiable doit inclure un **fichier de changement** (voir «
  Changements et Versionnage »).

## Commits conventionnels + DCO (appliqué)

Chaque commit doit:

- suivre les **Conventional Commits** (lintés localement via Husky et en CI), et
- inclure une ligne de **signature DCO**, par exemple:

````
Signed-off-by: Your Name <you@example.com>
Signé par: Votre Nom <vous@exemple.com>

Conseil: utilisez `git commit -s` pour ajouter automatiquement la ligne DCO.

Types autorisés:

- `feat`
- `fix`
- `perf`
- `refactor`
- `docs`
- `test`
- `build`
- `chore`
- `revert`

## Tests et couverture

- Exécuteur de tests: **Vitest**.
- UI tests: **@testing-library/react** (for `quojs-react`).
- Les seuils de couverture sont appliqués dans la configuration de Vitest:
   - Lignes / Branches / Fonctions / Déclarations: **≥ 95%** (sur le code touché).
- Instantanés uniquement pour des sorties stables et déterministes.

Courir:

test rapide

## Linting et formatage

- ESLint (TypeScript), Prettier.
- Scripts par paquet exécutés via `rushx`.

Exemples:

```bash
rush lint
cd packages/quojs-react && rushx lint
rushx format
````

## Construire le cache (Rush)

Le dépôt active le cache de construction **local** de Rush. La configuration du cache se trouve
à:

- Niveau du dépôt: `common/config/rush/build-cache.json`
- Sorties par package: `packages/<nom>/config/rush-project.json`

Les sorties sont mises en cache depuis `dist/` pour les deux packages principaux. Pour
`@quojs/core`, la clé de cache inclut également `BUILD_TARGET`.

Notes:

- `rush build` lira/écrira le cache.
- `rush rebuild` **contourne** le cache et recompile à partir de zéro (par conception).

## Changements et versionnage (Rush)

### Changer les fichiers

Créer des entrées de changement dans `common/changes/`:

changement rapide

CI vérifie les fichiers de modification sur les PR:

```bash
rush change -v
```

### Politiques de version

- `quojs-lockstep` (lockStepVersion): maintient **@quojs/core** et **@quojs/react**
  synchronisés.
- `lib-individual` (individualVersion): réservé aux futurs adaptateurs non liés au noyau.

Les projets sont assignés dans `rush.json` via `versionPolicyName`.

## Sorties

### Sortie officielle (mainteneurs)

1. Mettre à jour les versions/journaux de modifications à partir des fichiers de modifications
   accumulés:

```bash
rush version
```

2. Publier sur le vrai registre (exemples de drapeaux ; ajouter OTP/accès si nécessaire):

```bash
rush publish --apply --publish --target-branch main
```

Conseil: exécutez `rush publish` sans aucun drapeau pour simuler le plan.

### Répétition de la publication locale (Verdaccio)

Nous soutenons deux styles de répétition sécurisés:

#### A) Essai à sec uniquement avec des tarballs (sans registre)

Produit des fichiers `.tgz` pour chaque package public sous `./dist-tarballs/`.

```bash
rush change
rush publish --include-all --pack --release-folder ./dist-tarballs
```

Consommer dans les applications:

```bash
pnpm add ./dist-tarballs/quojs-core-<ver>.tgz tgz
pnpm add ./dist-tarballs/quojs-quojs-react-<ver>. tgz
```

#### B) Publication complète du registre local (Verdaccio)

Nous utilisons **Verdaccio** pour simuler un registre et tester le flux d'installation
exactement comme le feraient de vrais consommateurs.

1. Démarrer Verdaccio:

```bash
docker compose -f ops/verdaccio/docker-compose.yml up -d
```

2. Authentifiez-vous une fois:

```bash
pnpm set registry http://localhost:4873/
pnpm adduser --registry  http://localhost:4873/
pnpm profile set password --registry http://localhost:4873/
```

3. Exécutez le script de publication:

```bash
common/scripts/publish-verdaccio.sh
```

Ce qu'il fait:
- Publie tous les packages `@quojs/*` (à l'exception des internes comme `@quojs/repo-tools`)
- Utilise les **versions exactes** de `package.json` (sans suffixe `-local`, sans dist-tags)
- Désactive les scripts et la provenance pour éviter les échecs de husky/prepack
- Laisse Git intact — il s'agit uniquement d'une **répétition locale**

4. Consommez les packages dans vos applications:

```bash
echo '@quojs/:registry=http://localhost:4873/' >> .npmrc
pnpm add @quojs/core@<version> @quojs/react@<version>
```

Utilisez les vrais numéros de version (par exemple, `0.1.0`) tels qu'ils sont dans
`package.json`.

5. Réinitialiser le registre:

```bash
docker compose -f ops/verdaccio/docker-compose.yml down -v
unset npm_config_registry
```

### Notes

- Les registres ne permettent pas de republier la même version ; augmentez le patch pour les
  répétitions ou effacez le stockage de Verdaccio.
- Le registre au moment de l'installation par défaut est npmjs via `common/config/rush/.npmrc`.
- Le registre de publication est Verdaccio via `common/config/rush/.npmrc-publish` en utilisant
  `${NPM_AUTH_TOKEN}`.

## Soumettre des bugs et des PRs (GitHub)

- Utilisez les modèles de problèmes **Rapport de bug** et **Demande de fonctionnalité**.
- Les PRs doivent suivre le **modèle de Pull Request**.

Liste de contrôle minimale pour les PR:

- Commit conventionnel + signature DCO
- `rush build` et `rush test` passent localement
- Fichier de modification ajouté (si le package publiable a été modifié)
- La couverture respecte les seuils (sinon, l'IC échouera)

## Sécurité

Voir [SÉCURITÉ](../SECURITY.md). Ne **pas** ouvrir de problèmes publics pour les vulnérabilités.

## Dépannage (réponses rapides)

- Fichier de modification manquant → exécuter `rush change`; CI vérifie également
  `rush change -v`.
- Commit rejeté localement → corrigez le message de commit pour qu'il respecte les Conventional
  Commits et ajoutez la ligne DCO; ou utilisez `git commit -s`.
- Le cache semble obsolète → rappelez-vous que `rush rebuild` ignore le cache ; utilisez
  `rush build` pour bénéficier du cache.
- Verdaccio "la version existe déjà" → augmenter la version (via `rush change` + `rush version`)
  ou effacer le stockage de Verdaccio.
- Les installations atteignent de manière inattendue Verdaccio → assurez-vous de ne pas avoir
  exporté `npm_config_registry`; supprimez toutes les substitutions `.npmrc` par projet.

## Conseils pour l'éditeur et l'expérience développeur

- Les extensions recommandées pour VS Code se trouvent dans `.vscode/extensions.json`.
- Le formatage est standardisé via `.prettierrc.json` et `.editorconfig`.
- Les références de projet TypeScript sont configurées pour améliorer la navigation dans l'IDE
  et les constructions.
