![Logo Quo.js](../../assets/logo.svg)

# Contribuer à Quo.js

> [ 🇲🇽 Versión en Español](../es/CONTRIBUTING.md)&nbsp; |
> &nbsp;[ 🇵🇹 Versão Portuguesa](../pt/CONTRIBUTING.md)&nbsp; |
> &nbsp;[ 🇺🇸 English Version](../../CONTRIBUTING.md)&nbsp; |
> &nbsp; 👉 [ 🇫🇷 Version française](./CONTRIBUTING.md)

Merci de votre intérêt à contribuer ! 🎉 Ce projet est open-source sous **MPL-2.0** avec un
modèle de gouvernance accueillant et léger.

- **Licence du code :** MPL-2.0
- **Licence des documents :** CC BY 4.0 (sauf indication contraire)
- **Code de conduite :** Contributor Covenant v2.1
- **DCO :** Developer Certificate of Origin 1.1 (signature requise sur chaque commit)

Pour le flux de travail d'ingénierie complet et le processus de publication, consultez le
**Guide du Développeur** : [./DEVELOPER_GUIDE.md](./DEVELOPER_GUIDE.md). Ce fichier
est un guide de démarrage rapide pour les contributeurs et les auteurs de PR.

## Démarrage rapide (Rush monorepo)

````bash
# installer rush une fois
npm i -g @microsoft/rush

# installer toutes les dépendances (pnpm via Rush)
rush install

# construire tout (incrémental, utilise le cache Rush)
rush build

# exécuter les tests à travers le dépôt
rush test

# lint tous les packages qui définissent un script 'lint'
rush lint

# focus builds
rush build --to @quojs/core
rush build --from @quojs/react

# travailler à l'intérieur d'un seul package
cd packages/quojs
rushx build
rushx test
rushx lint

Chaque package publiable a son propre `package.json`.  La racine est privée et **non** publiée.

## Flux de travail

1. **Branche** depuis `main` : `feature/<issue>-<slug>` ou `fix/<issue>-<slug>`.
2. **Coder** avec des tests et de la documentation.
3. **Les portes locales** doivent passer : `rush build`, `rush test`, `rush lint`.
4. **Fichier de changement** (si un package publiable a été modifié) :
   ```bash
   rush change
````

5. **Ouvrir une Pull Request** (remplir le modèle, lier les problèmes/RFCs). CI applique le
   style de commit, le DCO, les fichiers de modification, les tests et la couverture.
6. **Revue et fusion** (squash ou rebase selon la décision du mainteneur).

## Style de Commit (Conventional Commits) + DCO (requis)

Utilisez le format conventionnel :

type(scope): résumé court

corps (facultatif)

**Types autorisés :** `feat`, `fix`, `perf`, `refactor`, `docs`, `test`, `build`, `chore`,
`revert`

**Exemples**

- `feat(quojs) : ajouter des abonnements à des chemins profonds avec des caractères génériques`
- `fix(quojs-react): normaliser le point de tête dans use` SliceProp`
- `test(store) : couvrir les outils de développement` DISPATCH appliquer l'état

**Signature DCO** — chaque commit doit inclure une ligne de signature :

````
Signed-off-by: Your Name <you@example.com>
Signé par : Votre Nom <vous@exemple.com>

Conseil : utilisez `git commit -s` pour l'ajouter automatiquement.  Les messages de commit sont vérifiés localement (Husky) et dans CI.

## Tests et Couverture

- Exécuteur de tests : **Vitest**
- Tests d'interface utilisateur : **@testing-library/react** (pour `quojs-react`)
- Seuils de couverture imposés dans la configuration de Vitest :
   - Lignes / Branches / Fonctions / Déclarations : **≥ 95%** (sur le code touché)
- Préférez des tests ciblés et robustes ; utilisez des instantanés uniquement pour des sorties stables et déterministes.

Exécuter tous les tests :

test rapide

## Linting et Formatage

- Lint : **ESLint** (TypeScript)
- Format : **Prettier**

```bash
rush lint
rushx format
````

## Soumettre des Problèmes et des PRs

- Utilisez les modèles de problèmes **Rapport de bug** et **Demande de fonctionnalité**.
- Les PRs doivent suivre le **modèle de Pull Request** et inclure :
  - Titre de commit conventionnel + signature **DCO**
  - Vérifications locales réussies : `rush build`, `rush test`, `rush lint`
  - **Changer le fichier** si un package publiable a été modifié
  - Tests adéquats et mises à jour de la documentation

## Sécurité

Si vous trouvez un problème de sécurité, **n'ouvrez pas de problème public**. Suivez
**SECURITY.md** pour une divulgation responsable.

Merci d'avoir contribué! ❤️
