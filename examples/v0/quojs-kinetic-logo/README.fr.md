# Logo Cinétique de Quo.js (React + SVG)

![Quo.js logo](./public/assets/quojs-dots.gif)

> [ 🇲🇽 Versión en Español](./README.es.md)&nbsp; |
> &nbsp;[ 🇵🇹 Versão Portuguesa](./README.pt.md)&nbsp; | &nbsp;
> [ 🇺🇸 English Version](./README.md)&nbsp; | &nbsp; 👉 [ 🇫🇷 Version française](./README.fr.md)

**Un logo cinétique composé d’environ 1,5k cercles SVG, animé par un mini moteur de simulation et synchronisé avec un store Quo.js.**  
Cet exemple se trouve dans le monorepo Rush :

```
examples/v0/quojs-dots
```

Il met en avant Quo.js comme un conteneur d’état **prévisible, typé et piloté par événements** avec **des abonnements très fins** qui gardent les re‑renders React légers — même quand des milliers d’éléments se mettent à jour à chaque frame.

---

## Pourquoi Quo.js ici ?

- **Canaux + événements (pas de soupe d’action types)** : on envoie sur le canal `"logo"` avec des événements comme `"batchUpdate"`, `"fps"`, etc.
- **Sélecteurs ultra‑granulaires** : chaque `<Circle/>` s’abonne à **son propre** nœud `logo[group][id]` via `useAtomicProp`, évitant les re‑renders du slice entier.
- **Reducer immuable et ergonomique** : un seul reducer (`Logo.reducer.ts`) gère les mises à jour atomiques et par lot sans magie.
- **Hooks typés** : `createQuoHooks` génère `useStore`, `useEmit`, `useSelector`, `useAtomicProp`, `useAtomicProps` avec inférence TypeScript complète.
- **Effets d’événements** : le moteur écoute les effets du store (p. ex., `"logo":"start" | "stop"`) pour coordonner le cycle de vie de la simulation.

Résultat : **60fps fluides** sur les machines capables, avec React qui ne touche le DOM que pour les cercles réellement déplacés.

---

## Fonctionnement (vue d’ensemble)

1. **Engine + Simulation**  
   - `Engine` exécute une boucle `rAF`, lisse le FPS et envoie `logo/fps` toutes les ~250 ms.
   - `Simulation` possède des éléments `Circle`. Chaque élément progresse d’un départ aléatoire vers son pixel “maison” (le logo), puis reste au repos — repoussé par la souris et revenant tranquillement à sa position.

2. **Image → specs (une fois)**  
   - `extractCircleSpecsFromImage()` échantillonne un PNG transparent (`assets/logo.png`) pour produire `CircleSpec[]` avec `group: "d" | "u" | "x"`.  
   - On envoie `logo/size` et `logo/count` pour que l’UI connaisse la taille du canevas et les totaux par groupe.

3. **Mises à jour par frame → écritures groupées dans le store**  
   - À chaque frame, `Simulation.loop()` agrège les mises à jour et envoie **un** `logo/batchUpdate` avec de nombreux changements.  
   - Le reducer ne met à jour que les nœuds modifiés, gardant le store compact et React précis.

4. **Rendu granulaire**  
   - Chaque `<Circle group id>` s’abonne à `logo[group][id]` via `useAtomicProp`. Si un cercle n’a pas bougé, il **ne se re‑rendra pas**.

5. **Fin d’intro + métriques**  
   - Pendant l’intro, `logo/introProgress` suit le nombre restant. Une fois tous “à la maison”, on envoie `logo/introComplete`.

---

## Exécution (monorepo Rush)

> On suppose que vous êtes à la **racine** du monorepo Quo.js.

1) **Installer + construire les paquets** (pour que l’exemple résolve les workspaces `@quojs/*`)
```bash
rush install
rush build     # ou : rush build -t quojs-dots
```

2) **Démarrer le serveur de dev de l’exemple**
```bash
cd examples/v0/quojs-dots
rushx dev      # lance Vite
```

3) Ouvrez l’URL locale affichée (généralement `http://localhost:5173`). Déplacez la souris sur le logo — les points orbitent/évitaient, puis reviennent.

> Alternative depuis la racine du monorepo :
```bash
rushx -p quojs-dots dev
```

---

## Structure du projet (fichiers clés)

```
src/
  App.tsx                       # démarre Engine, extrait les specs du PNG du logo, relie Simulation → Store
  components/screen/Screen.*    # conteneur d’écran (SVG), lit store.size, rend la liste de <Circle/>
  components/screen/items/circle/
    Circle.component.tsx        # s’abonne à son propre nœud logo[group][id] via useAtomicProp
  context/Store.context.tsx     # contexte React pour le store Quo typé
  state/
    types.ts                    # AppState, LogoState, cartes d’actions typées (LogoAM, AppAM)
    logo/Logo.reducer.ts        # reducer immuable ; mises à jour atomiques + groupées, fps, intro, size
    hooks.ts                    # createQuoHooks(...): hooks React typés
    store.ts                    # createStore(...) avec le reducer de logo
  utils/
    engine/                     # Engine (boucle rAF), Simulation (éléments + quadtree), comportement de Circle
    image/                      # PNG → ImageData + extractor → CircleSpec[]
    Quadtree.ts                 # index spatial pour interroger les cercles proches lors des mouvements de souris
    index.ts                    # helpers numériques (expApproach, orbit/avoid, etc.)
  assets/logo.png               # image source pour l’échantillonnage
```

---

## Spécifiques Quo.js présentés ici

- **`batchUpdate`** : une action, de nombreuses mises à jour → moins de travail pour le reducer et moins de commits React.
- **`useAtomicProp`** : abonnement direct à un chemin profond (`logo["d"]["circle_d_42"]`). Pas de pièges de mémo, pas de sélecteurs qui allouent de nouveaux objets à chaque rendu.
- **API d’effets** (`store.onEffect("logo", "start" | "stop")`) : le moteur réagit aux événements d’état via le pipeline async integre de Quo.js.
- **Reducer pur et immuable** : `upsertItem()` applique un no‑op quand rien n’a changé → moins de mises à jour se propagent.

Si ce pattern vous plaît dans une démo, il s’adapte proprement à des UIs réelles avec des milliers de nœuds, des charges de streaming/animation et des budgets de rendu stricts.

---

## Dépannage

- **Écran blanc ou erreur de fetch** : vérifiez que `assets/logo.png` est accessible (Vite dev server) et que le navigateur supporte `createImageBitmap`. Un fallback existe, mais certaines CSP peuvent le bloquer.
- **Lenteur sur machines modestes** : réduisez `maxCircles` dans `App.tsx` (p. ex., 800) ou augmentez le `spacing` de l’extractor (p. ex., de `3` à `5`).