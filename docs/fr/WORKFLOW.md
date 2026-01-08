![Logo Quo.js](../../assets/logo.svg)

# Flux de travail continu

> [ 🇲🇽 Versión en Español](../es/WORKFLOW.md)&nbsp; |
> &nbsp;[ 🇵🇹 Versão Portuguesa](../pt/WORKFLOW.md)&nbsp; |
> &nbsp;[ 🇺🇸 English Version](../../WORKFLOW.md)&nbsp; |
> &nbsp; 👉 [ 🇫🇷 Version française](./WORKFLOW.md)

Ce document décrit le flux de développement et de publication des paquets Quo.js en utilisant le **versioning indépendant** dans un monorepo avec Rush.

## Développement quotidien

- **Branches de fonctionnalité/correction** créées à partir de `main` :
   - Exemples de noms de branches : 
     - `feat(core): ...` 
     - `fix(react): ...`
   - Générer des fichiers de modification :
     ```bash
     changement précipité -v
     ```
     - Utilisez **patch** pour les corrections. 
     - Utilisez **mineur** pour les nouvelles fonctionnalités. 
     - Utilisez **mineur** pour les changements incompatibles (tant que `<1.0.0`, tous les changements majeurs sont considérés comme mineurs).
   - Ouvrez une PR → fusionnez après la révision.

## Cycle de Travail TypeDoc

Garder la documentation synchronisée avec le code est essentiel pour la clarté, l’intégration et la référence de l’API.
Suivez ces étapes chaque fois que vous modifiez ou ajoutez du code :

1. Documentez votre code

Après avoir terminé votre implémentation, assurez-vous que tout le nouveau code (ou code mis à jour) contient des annotations TypeDoc telles que @param, @returns et @example.
Ces annotations sont essentielles, car elles permettent au générateur de documentation d’extraire les commentaires, les types et les exemples vers les fichiers Markdown.

2. Générez la documentation

Exécutez la commande Rush pour reconstruire la documentation.

```bash
  rushx:docs
```

Cela appellera TypeDoc et régénérera tous les fichiers Markdown à partir de vos annotations.

3. Vérifiez le résultat

Ouvrez les fichiers Markdown générés et confirmez que vos modifications apparaissent correctement.
Vérifiez que les nouvelles fonctions, classes et propriétés sont listées, que les descriptions et exemples sont à jour et qu’aucune section obsolète ne reste.

4. Validez la documentation

Une fois tout vérifié, validez la documentation générée en utilisant un message de commit conventionnel avec le type "docs".
Cela garde l’historique propre et aide les workflows CI/CD à s’exécuter correctement.

## Cycle de versionnement et de publication

Cela peut être manuel ou automatisé en intégration continue :

```bash
version précipitée --appliquer-la-politique-de-version
rush publish --publish --apply --target-branch main
```

- Seules les paquets contenant des fichiers de modification sont versionnés. 
- Les paquets sans modification conservent leur version. 

## Changements incompatibles dans `@quojs/core`

- Augmente le **minor** dans le cœur (par exemple : `0.2.x → 0.3.0`). 
- Mettez à jour les adaptateurs validés vers :

```json
   "peerDependencies": {
     "@quojs/core": "^0.3.0"
   }
   ```

- Générer des fichiers de modification pour ces adaptateurs (patch ou mineur selon le cas). 
- Ne publiez que les adaptateurs validés. 
- **N'incrémentez pas d'adaptateurs que vous n'avez pas encore vérifiés** ; la vérification des dépendances par les consommateurs les protégera.

## Pré-versions

- Pour un travail expérimental ou risqué, publie des pré-versions :
   ```bash
   0.2.0-alpha.0
   ```
   en utilisant `--tag next` (dans npm) ou en publiant sur Verdaccio. 
- Les adaptateurs peuvent adopter la nouvelle gamme de dépendances de manière progressive.

# Pourquoi ce flux fonctionne

- **Versionnage indépendant** → seuls les paquets modifiés changent de version. 
- **Commencer à `0.1.0`** → les plages avec le caret fonctionnent comme prévu (`^0.1.0` permet la flottation des correctifs, pas des versions mineures). 
- **Fichiers de modifications depuis le premier jour** → Rush reste cohérent et génère des notes de version claires. 
- **Étiquettes par paquet** → facilitent le bisect et la génération de journaux de modifications.