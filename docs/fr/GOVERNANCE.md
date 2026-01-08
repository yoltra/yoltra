![Quo.js logo](../../assets/logo.svg)

# Gouvernance de Quo.js

> [ 🇲🇽 Versión en Español](../es/GOVERNANCE.md)&nbsp; |
> &nbsp;[ 🇵🇹 Versão Portuguesa](../pt/GOVERNANCE.md)&nbsp; |
> &nbsp;[ 🇺🇸 English Version](../../GOVERNANCE.md)&nbsp; |
> &nbsp; 👉 [ 🇫🇷 Version française](./GOVERNANCE.md)

Ce document explique comment les décisions sont prises et comment les contributeurs deviennent des mainteneurs.

## Rôles

- **Contributeurs** : Toute personne envoyant des PRs, des problèmes ou des documents. 
- **Mainteneurs** : Contributeurs de confiance ayant des droits de fusion pour un ou plusieurs packages. 
- **Lead Maintainer**: Coordinates roadmap and releases (initially **@pixerael / Erael Group.**).

Une liste des mainteneurs actuels est conservée dans [MAINTAINERS.md](./MAINTAINERS.md) (si présent) ou dans l'organisation/équipe GitHub.

## Prise de Décision

Nous visons un **consensus paresseux** :
1. Proposer un changement via PR ou RFC (pour des modifications substantielles de l'API).
2. Maintenir une courte fenêtre de discussion (généralement de 3 à 7 jours pour les RFC).
3. Si aucune objection bien raisonnée n'est soulevée, la proposition est acceptée.

Si un consensus ne peut être atteint, le **Mainteneur Principal** (ou le mainteneur délégué pour le paquet) décide.

## RFCs

Utilisez un RFC lorsque :
- Vous modifiez les API publiques ou le comportement de manière incompatible.
- Introduire des dépendances majeures ou des changements architecturaux.
- Proposer de nouveaux packages principaux.

Modèle de RFC :
- Motivation et objectifs
- Conception et alternatives
- Esquisse de l'API et exemples
- Plan de migration et risques
- Stratégie de test

## Sorties et Versionnage

- Le versionnage suit **SemVer**.
- Chaque package est versionné indépendamment.
- Le **Responsable des Sorties** (tournant parmi les mainteneurs) prépare les journaux de modifications et les étiquettes.
- Les changements cassants nécessitent :
   - Un RFC ou une justification claire
   - Notes de migration dans le journal des modifications
   - Tests démontrant le changement

## Attentes des Mainteneurs

- Soyez respectueux et suivez le **Code de Conduite**.
- Examiner les PRs rapidement et de manière constructive.
- Maintenir une couverture de test élevée et une qualité de documentation élevée.
- Divulguer les conflits d'intérêts.

## Ajouter/Supprimer des Mainteneurs

- **Nomination** : Tout mainteneur peut nommer un contributeur.
- **Critères** : Contributions de qualité constantes (code/docs/revues), bonne communication, valeurs partagées du projet.
- **Approbation** : Consensus paresseux parmi les mainteneurs.  Le Mainteneur Principal confirme les changements d'accès.
- **Inactivité** : Les mainteneurs inactifs pendant environ 6 mois peuvent être déplacés vers le statut "alumni" (ils peuvent revenir plus tard).

## Marques de commerce et image de marque

Les noms « Quo.js » et « quojs-react » sont des marques déposées du groupe Erael.  Voir [TRADEMARKS.md](./TRADEMARKS.md).  La gouvernance n'implique pas une licence de marque.

## Changements de Gouvernance

Les changements de gouvernance suivent le processus RFC et nécessitent l'approbation explicite du Mainteneur Principal.
