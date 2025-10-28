![Quo.js logo](../../assets/logo.svg)

# MAINTENEURS

> [ 🇲🇽 Versión en Español](../es/MAINTAINERS.md)&nbsp; |
> &nbsp;[ 🇵🇹 Versão Portuguesa](../pt/MAINTAINERS.md)&nbsp; |
> &nbsp;[ 🇺🇸 English Version](../../MAINTAINERS.md)&nbsp; |
> &nbsp; 👉 [ 🇫🇷 Version française](./MAINTAINERS.md)

Ce fichier liste les mainteneurs actifs et les domaines de responsabilité pour le monorepo Quo.js.

- **Lead Maintainer:** Manu Ramirez (@pixerael), Erael Group.
- **Project Email:** [opensource@quojs.dev](mailto:opensource@quojs.dev)
- **Security Contact:** security@quojs.dev (see  [SECURITY.md](./SECURITY.md))
- **Code de conduite :** [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md)

Les mainteneurs sont censés suivre les flux de travail dans [GOVERNANCE.md](./GOVERNANCE.md) et [CONTRIBUTING.md](./CONTRIBUTING.md).

## Mainteneurs actuels

| Identifiant GitHub | Nom         | Domaine(s)                                   | Notes                        | | ---------------| --------------| -------------------------------------------| ------------------------------ | @pixerael     | Manu Ramirez | Globalement, sorties, marques déposées             | Propriétaire par intérim de tous les packages|

### Sièges de mainteneur ouverts

Nous invitons les mainteneurs de la communauté pour les rôles ci-dessous.  Voir **Devenir un Mainteneur**.

| ID de rôle    | Domaine(s)                                  | Attente de temps    | Statut  |
| ----------------| ----------------| ---------------------------------------------| ----------------------| ---------|
| @co-maintainer | quojs core (store/reducer/bus/utils)          | ~2–4 heures/semaine        | **OUVERT**|
| @react-maint   | quojs-react (hooks, suspense, docs/exemples)  | ~2–4 heures/semaine        | **OUVERT**|

## Propriété du Package

| Package / Chemin           | Propriétaires                                     | --------------------------| -------------------------------------------- | `packages/core`          | @pixerael (intérimaire), **@co-maintainer (OUVERT)** |
| `packages/react`         | @pixerael (intérimaire), **@react-maint (OUVERT)**   |
| `examples/*`             | @pixerael (intérimaire), **@react-maint (OUVERT)**   |
| `docs/*`                 | @pixerael (intérimaire), **@react-maint (OUVERT)**   |

Jusqu'à ce que les sièges soient remplis, @pixerael est le propriétaire par intérim et le réviseur final.

## Gestion des versions

- **Rotation :** Les propriétaires se relaient pour le rôle de « Responsable de la publication » à chaque version mineure.
- **Devoirs :** changelog, mise à jour des versions, tags, notes de publication GitHub, publication npm (si applicable).
- **SemVer :** requis.  Les changements cassants nécessitent des notes de migration et (généralement) un RFC.

## Devenir un Mainteneur

Nous accueillons les candidatures pour les postes de **@co-maintainer** et **@react-maint**.

**Éligibilité (indicative) :**
- Contributions soutenues et de haute qualité (code/docs/revues) dans le domaine pertinent.
- Collaboration constructive alignée avec le Code de Conduite.
- Familiarité avec l'architecture et la feuille de route du projet.

**Comment postuler :**
1. Ouvrez une discussion sur GitHub intitulée **« Candidature de mainteneur : \<rôle\> – \<votre pseudo\> »**.
2. Incluez :
    - Votre parcours et fuseau horaire
    - Expérience pertinente en OSS / liens
    - Domaines que vous aimeriez posséder / améliorer
   - Estimation de disponibilité
3. Obtenir les retours de la communauté (consensus paresseux pendant 5 jours).
4. Un mainteneur actuel (Lead ou propriétaire par intérim) confirmera la nomination conformément à `GOVERNANCE.md`.

**Attentes :**
- Trier les problèmes, examiner les demandes de tirage et aider aux versions.
- Assister (ou examiner de manière asynchrone) les notes de planification mensuelles.
- Adhérer à `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, et `SECURITY.md`.

## Inactif / Ancien

Les mainteneurs inactifs pendant environ 6 mois peuvent être déplacés vers le statut **Alumni** et peuvent être réintégrés ultérieurement sur demande.

## Escalade

Si un consensus ne peut être atteint sur une décision technique, le **Responsable Principal de la Maintenance** décide (ou délègue au propriétaire du paquet).  Les changements de gouvernance suivent le RFC.
