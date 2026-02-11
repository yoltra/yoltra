# Gestion d'etat : comparaison architecturale

> [ 🇲🇽 Versión en Español](https://github.com/quojs/quojs/blob/main/docs/es/design/state-management-library-comparison.md)&nbsp; |
> &nbsp;[ 🇵🇹 Versão Portuguesa](https://github.com/quojs/quojs/blob/main/docs/pt/design/state-management-library-comparison.md)&nbsp; |
> &nbsp;[ 🇺🇸 English Version](https://github.com/quojs/quojs/blob/main/docs/en/design/state-management-library-comparison.md)&nbsp; |
> &nbsp; 👉 [ 🇫🇷 Version française](https://github.com/quojs/quojs/blob/main/docs/fr/design/state-management-library-comparison.md)

**Version :** 0.7.0
**Derniere mise a jour :** Fevrier 2026

## Introduction

Les bibliotheques de gestion d'etat font des **paris architecturaux** differents. Ces paris determinent quels problemes chaque bibliotheque resout le plus naturellement et ou elle cree des frictions. Ce document examine ces differences architecturales honnetement -- non pas pour declarer un gagnant, mais pour vous aider a choisir le bon outil pour votre probleme specifique.

Chaque section decrit le modele central d'une bibliotheque, explique la classe d'applications ou ce modele excelle, et met en lumiere ses differences par rapport a l'approche de Quo.js.

---

## Quo.js en bref

Quo.js repose sur trois paris architecturaux :

1. **Abonnements au niveau des chemins** -- Les composants s'abonnent a des chemins pointes (`"items.0.title"`, `"items.*.done"`) et ne se re-rendent que lorsque ce chemin exact change.
2. **Pipeline d'evenements structure** -- Les evenements transitent par un pipeline formel et interceptable : dedup -> middleware (peut rejeter) -> reducers -> abonnes d'evenements -> effets -> abonnes grossiers.
3. **Evenements types par canaux** -- Les evenements sont des tuples `(channel, type, payload)` au lieu de chaines d'action plates.

```typescript
// Abonnement au chemin : ne se re-rend que lorsque items[0].title change
const title = useAtomicProp({
  reducer: 'todos',
  property: 'items.0.title',
});

// Evenement type par canal
await emit('todos', 'toggle', { id: '123' });
```

**Ou cette architecture excelle :** Les applications avec de nombreux elements UI se mettant a jour independamment (tableaux de bord, editeurs collaboratifs, grilles de donnees, systemes de particules), les applications necessitant une autorisation/validation des evenements au niveau du middleware, et les applications universelles partageant la logique d'etat entre client et serveur.

**Ou elle cree des frictions :** Les applications simples ou la granularite au niveau des chemins est un overhead inutile. Les applications ou la taille du bundle doit rester sous 5KB. Les projets ou l'equipe prefere les mises a jour de style mutable ou l'etat distribue base sur des atomes.

---

## Redux Toolkit

### Architecture

Redux Toolkit (RTK) repose sur un **flux de donnees unidirectionnel avec des reducers synchrones et purs**. L'etat vit dans un store unique. Les mises a jour se font via des actions dispatchees traitees par des reducers de slice. Immer fournit des mises a jour immutables ergonomiques. La logique asynchrone est geree par les thunks ou RTK Query.

```typescript
const todosSlice = createSlice({
  name: 'todos',
  initialState: { items: [] },
  reducers: {
    addTodo: (state, action) => {
      state.items.push(action.payload); // Syntaxe de mutation alimentee par Immer
    },
  },
});

dispatch(addTodo({ id: '1', title: 'Buy milk' }));
```

### Ou Redux Toolkit excelle

**Grandes equipes avec des patterns etablis.** Redux est la solution de gestion d'etat la plus eprouvee dans React. Ses conventions strictes (actions, reducers, selecteurs) creent de la coherence dans les grandes bases de code. RTK Query fournit une solution complete de recuperation de donnees avec mise en cache automatique et re-fetching. L'ecosysteme DevTools est inegale.

**Applications necessitant un middleware extensif.** Le modele de middleware de Redux est mature et dispose de milliers de solutions communautaires pour le logging, l'analytique, la persistance et le suivi d'erreurs.

### Differences architecturales avec Quo.js

**Granularite des abonnements.** Les abonnements Redux operent au niveau du store -- `useSelector` s'execute a chaque dispatch et s'appuie sur l'egalite de reference pour abandonner. Les abonnements Quo.js operent au niveau du chemin et ne se declenchent que lorsque le chemin souscrit change reellement.

```typescript
// Redux : le selecteur s'execute a CHAQUE dispatch, abandon via verification d'egalite
const title = useSelector(state => state.todos.items[0]?.title);

// Quo.js : l'abonnement ne se declenche que lorsque items.0.title change
const title = useAtomicProp({
  reducer: 'todos',
  property: 'items.0.title',
});
```

Cette difference compte le plus dans les UIs avec de nombreux elements se mettant a jour independamment. Dans une liste de 100 elements, un `useSelector` Redux dans chaque ligne s'execute 100 fois a chaque dispatch. Un `useAtomicProp` Quo.js dans chaque ligne ne se declenche que pour la ligne specifique qui a change.

**Modele d'evenements.** Les actions Redux sont des chaines plates (`"todos/addTodo"`). Les evenements Quo.js sont des tuples types par canaux (`('todos', 'add', payload)`). Les deux approches fonctionnent ; les canaux fournissent un namespacing naturel a grande echelle, tandis que les chaines plates s'integrent mieux avec l'ecosysteme Redux DevTools et middleware.

**Modele asynchrone.** Redux separe les reducers synchrones des thunks asynchrones. Le middleware et les effets de Quo.js sont asynchrones par defaut -- les operations asynchrones font partie du pipeline central plutot qu'une couche separee.

---

## Zustand

### Architecture

Zustand repose sur la **mutation directe de l'etat via une fonction `set()`**. L'etat et les actions coexistent dans un seul appel `create()`. Pas d'actions, pas de reducers, pas de middleware -- juste des fonctions qui appellent `set()`. Les abonnements utilisent des fonctions de selection.

```typescript
const useStore = create((set) => ({
  todos: [],
  addTodo: (todo) => set((state) => ({
    todos: [...state.todos, todo],
  })),
}));

const todos = useStore(state => state.todos);
```

### Ou Zustand excelle

**Petites a moyennes applications qui valorisent la simplicite.** Zustand a le moins de ceremonie de toutes les bibliotheques d'etat. Il pese environ 1KB. Il n'y a quasiment pas de courbe d'apprentissage -- si vous comprenez `useState`, vous comprenez Zustand. C'est ideal pour ajouter de l'etat partage a une application sans engagement architectural.

**Adoption graduelle.** Zustand ne necessite pas de providers, de contexte ou de restructuration. Vous pouvez l'ajouter a n'importe quel arbre de composants incrementalement.

### Differences architecturales avec Quo.js

**Explicite vs. minimalisme.** Zustand optimise pour le minimum de code pour faire fonctionner l'etat. Quo.js optimise pour des transitions d'etat explicites et tracables via des evenements. Ce sont des valeurs fondamentalement differentes -- Zustand fait confiance aux developpeurs pour garder les choses simples ; Quo.js fournit une structure qui monte en charge.

```typescript
// Zustand : mise a jour directe -- minimale mais implicite
set((state) => ({ count: state.count + 1 }));

// Quo.js : evenement nomme -- plus de ceremonie mais tracable
await emit('counter', 'increment', 1);
```

**Modele d'abonnement.** Les selecteurs Zustand sont des fonctions qui s'executent a chaque appel `set()`. Optimiser pour des mises a jour fines necessite des fonctions d'egalite manuelles. Les abonnements de chemin de Quo.js sont fins par defaut.

```typescript
// Zustand : necessite une egalite personnalisee pour eviter les re-rendus inutiles
const title = useStore(
  state => state.todos[0]?.title,
  (a, b) => a === b,
);

// Quo.js : fin par defaut
const title = useAtomicProp({
  reducer: 'todos',
  property: 'items.0.title',
});
```

**Ordonnancement des evenements.** Les appels `set()` de Zustand sont immediats et synchrones. Plusieurs appels `set()` depuis differentes operations asynchrones peuvent s'entrelacer de maniere imprevisible. La file FIFO de Quo.js garantit un ordonnancement strict -- les evenements sont toujours traites dans l'ordre d'emission.

**Taille du bundle.** Zustand fait environ 1KB. Quo.js (`@quojs/core` + `@quojs/react`) fait environ 15KB. Si la taille du bundle est la contrainte principale, Zustand l'emporte clairement.

---

## Jotai

### Architecture

Jotai utilise un **etat distribue, base sur des atomes**. Au lieu d'un store central, l'etat est reparti entre des atomes independants. Les atomes peuvent deriver d'autres atomes, formant un graphe de dependances. Les composants s'abonnent a des atomes specifiques et ne se re-rendent que lorsque ces atomes changent.

```typescript
const countAtom = atom(0);
const todosAtom = atom([]);
const completedCountAtom = atom(
  (get) => get(todosAtom).filter(t => t.completed).length,
);

const [count, setCount] = useAtom(countAtom);
```

### Ou Jotai excelle

**Etat fin, a portee de composant.** Le modele d'atomes de Jotai est inheremment granulaire. Chaque atome est une unite d'etat independante, et les composants ne se re-rendent que lorsque leurs atomes specifiques changent. Cela rend Jotai excellent pour les UIs ou l'etat est naturellement distribue (champs de formulaire, toggles, widgets independants).

**Architecture Suspense-first.** Jotai a ete concu pour React Suspense des le depart. Les atomes asynchrones s'integrent naturellement avec les limites `<Suspense>`.

**Etat derive composable.** Les atomes derivant d'autres atomes creent un graphe reactif. C'est puissant pour les applications ou les valeurs calculees dependent de plusieurs sources d'etat independantes.

### Differences architecturales avec Quo.js

**Centralise vs. distribue.** Quo.js maintient un arbre d'etat unique auquel vous vous abonnez a des chemins specifiques. Jotai distribue l'etat entre des atomes independants. Les deux atteignent une reactivite fine, mais via des architectures opposees.

L'approche centralisee (Quo.js) facilite le raisonnement sur l'etat global, la coordination des mises a jour transversales et la serialisation/restauration de l'etat complet de l'application. L'approche distribuee (Jotai) facilite la creation d'unites d'etat autonomes et reutilisables et evite le besoin d'un provider dans les cas simples.

```typescript
// Jotai : l'etat est distribue entre les atomes
const titleAtom = atom('');
const doneAtom = atom(false);

// Quo.js : l'etat vit dans un arbre, abonne par chemin
const title = useAtomicProp({ reducer: 'todos', property: 'items.0.title' });
const done = useAtomicProp({ reducer: 'todos', property: 'items.0.done' });
```

**Tracabilite des evenements.** Les mises a jour d'atomes Jotai sont implicites -- vous appelez `setCount(count + 1)` et l'etat change. Il n'y a pas de journal d'evenements, pas de point d'interception middleware, pas de piste d'audit. Les evenements Quo.js sont explicites et tracables a travers tout le pipeline. Cela compte lorsque vous avez besoin de verifications d'autorisation, d'undo/redo ou d'analytique sur les transitions d'etat.

**Middleware et preoccupations transversales.** Jotai gere les preoccupations transversales (logging, persistance, validation) via du middleware d'atome ou des atomes wrapper -- une configuration par atome. Quo.js les gere de maniere centralisee via le pipeline d'evenements -- une seule fonction middleware peut intercepter tous les evenements.

---

## MobX

### Architecture

MobX utilise un **etat observable avec suivi automatique des dependances**. L'etat est enveloppe dans des proxies qui suivent quelles proprietes chaque composant lit. Lorsqu'une propriete observable change, seuls les composants qui l'ont lue se re-rendent. Les mises a jour sont de style mutable -- vous modifiez l'etat directement, et MobX suit la mutation.

```typescript
class TodoStore {
  @observable todos = [];

  @action
  addTodo(todo) {
    this.todos.push(todo); // MobX suit cette mutation
  }

  @computed
  get completedCount() {
    return this.todos.filter(t => t.completed).length;
  }
}

const App = observer(() => {
  return <div>{store.completedCount}</div>; // Auto-mise a jour
});
```

### Ou MobX excelle

**Reactivite implicite avec un minimum de boilerplate.** MobX suit automatiquement quelles proprietes un composant lit et ne re-rend que lorsque ces proprietes changent. Vous n'ecrivez pas de selecteurs, d'abonnements ou de comparaisons d'egalite -- ca marche tout seul. C'est puissant pour les developpeurs qui veulent une reactivite fine sans y penser.

**Applications orientees POO.** Les stores MobX bases sur des classes avec decorateurs s'integrent naturellement dans les architectures orientees objet. Si votre equipe pense en classes, proprietes calculees et etat encapsule, MobX est un choix naturel.

**Mises a jour de style mutable.** MobX vous permet d'ecrire `this.todos.push(todo)` au lieu de `{ ...state, todos: [...state.todos, todo] }`. Pour les mises a jour imbriquees complexes, c'est nettement plus lisible.

### Differences architecturales avec Quo.js

**Implicite vs. explicite.** MobX suit les dependances automatiquement via des proxies -- les composants se re-rendent "magiquement" lorsque les observables qu'ils lisent changent. Quo.js requiert des abonnements de chemin explicites -- vous declarez ce que vous observez. MobX est plus facile a utiliser ; Quo.js est plus facile a deboguer quand les choses tournent mal.

**Mutabilite.** MobX autorise (et encourage) la mutation directe des objets d'etat. Quo.js impose l'immutabilite -- l'etat est deep-frozen en developpement. Les deux approches ont des compromis : la mutation est ergonomique mais peut causer des bugs subtils lorsque les references sont partagees ; l'immutabilite est plus sure mais necessite plus de ceremonie pour les mises a jour imbriquees.

**Flux d'evenements.** MobX n'a pas de concept d'evenements ou d'actions comme entites de premiere classe (decorer avec `@action` sert au batching, pas a creer une piste d'evenements). Les evenements Quo.js transitent par un pipeline formel avec middleware, effets et phases confirme/non confirme. Si vous avez besoin d'intercepter, valider ou auditer les changements d'etat, Quo.js fournit l'infrastructure ; MobX necessite de la construire vous-meme.

---

## XState

### Architecture

XState modelise l'etat comme des **machines a etats finis et des statecharts**. Les transitions d'etat sont explicites et gouvernees par des definitions de machine. Chaque etat possible et chaque transition sont declares a l'avance. Le modele d'acteur permet des machines a etats concurrentes et isolees qui communiquent via des messages.

```typescript
const todoMachine = createMachine({
  id: 'todo',
  initial: 'idle',
  states: {
    idle: { on: { FETCH: 'loading' } },
    loading: {
      invoke: {
        src: 'fetchTodos',
        onDone: { target: 'success', actions: 'assignTodos' },
        onError: 'failure',
      },
    },
    success: { /* ... */ },
    failure: { /* ... */ },
  },
});
```

### Ou XState excelle

**Workflows complexes et etafuls.** XState est concu pour les processus avec de nombreux etats et des transitions conditionnelles -- flux de checkout, formulaires multi-etapes, logique de jeux, implementations de protocoles. La definition de machine garantit que les transitions d'etat invalides sont impossibles.

**Modelisation visuelle et documentation.** Les machines XState peuvent etre visualisees comme des diagrammes, en faisant une excellente documentation vivante. L'editeur visuel Stately permet aux non-ingenieurs de comprendre et valider la logique d'etat.

**Concurrence basee sur les acteurs.** Le modele d'acteur de XState est une veritable computation concurrente -- plusieurs machines fonctionnant independamment, communiquant via des messages. C'est puissant pour les applications avec des processus paralleles independants.

### Differences architecturales avec Quo.js

**Portee.** XState est concu pour l'**orchestration de workflows** -- la modelisation de processus qui traversent des phases distinctes. Quo.js est concu pour la **gestion d'etat orientee donnees** -- la gestion de l'etat de l'application auquel de nombreux elements UI s'abonnent. Ils resolvent des problemes differents et peuvent coexister dans la meme application (XState pour la logique de workflow, Quo.js pour l'etat de l'application).

**Boilerplate.** Les definitions de machine XState sont verbeuses par conception -- chaque etat et transition sont explicites. C'est une fonctionnalite, pas un defaut, pour les workflows ou l'explicite previent les erreurs. Mais pour la gestion d'etat CRUD generale, cette ceremonie est du overhead.

```typescript
// XState : machine explicite pour un compteur
const machine = createMachine({
  id: 'counter',
  initial: 'active',
  context: { count: 0 },
  states: {
    active: {
      on: {
        INCREMENT: { actions: assign({ count: (ctx) => ctx.count + 1 }) },
        DECREMENT: { actions: assign({ count: (ctx) => ctx.count - 1 }) },
      },
    },
  },
});

// Quo.js : reducer pour un compteur
const counterReducer = (state, event) => {
  switch (event.type) {
    case 'increment': return { count: state.count + 1 };
    case 'decrement': return { count: state.count - 1 };
    default: return state;
  }
};
```

**Modele d'abonnement.** XState n'a pas d'abonnements au niveau des chemins -- vous vous abonnez a l'etat de la machine et selectionnez depuis celui-ci. Les abonnements de chemin de Quo.js sont plus granulaires pour la gestion d'etat UI.

---

## Resume architectural

Chaque bibliotheque optimise pour une dimension differente :

| Bibliotheque | Optimise pour | Compromis central |
|---------|---------------|---------------|
| **Redux Toolkit** | Maturite de l'ecosysteme, conventions d'equipe | Plus de boilerplate et de setup, abonnements plus grossiers |
| **Zustand** | Surface d'API minimale, peu de ceremonie | Moins de structure pour les flux async complexes |
| **Jotai** | Atomes distribues et composables | Plus difficile de coordonner l'etat global |
| **MobX** | Reactivite implicite, ergonomie mutable | Plus difficile de tracer et deboguer les changements d'etat |
| **XState** | Correction des workflows, etats impossibles | Verbeux pour la gestion de donnees generale |
| **Quo.js** | Abonnements fins, pipeline d'evenements | Plus de setup que Zustand/Jotai, bundle plus gros |

Il n'y a pas de bibliotheque universellement "meilleure". Le bon choix depend de ce dont votre application a le plus besoin :

- **Friction minimale et petit bundle ?** Zustand ou Jotai.
- **L'equipe connait deja Redux ?** Redux Toolkit.
- **POO reactive avec mises a jour mutables ?** MobX.
- **Modelisation de workflows complexes ?** XState.
- **Abonnements fins aux chemins, autorisation d'evenements ou etat universel (client + serveur) ?** Quo.js.

---

## Lectures complementaires

- **[Architecture de la file d'evenements](./event-queue-architecture.md)** -- Comment le pipeline async de Quo.js fonctionne en coulisses
- **[Guide de demarrage rapide](https://github.com/quojs/quojs/blob/main/docs/en/QUICK_START_GUIDE.md)** -- Cinq etapes pour une application fonctionnelle
- **[API @quojs/core](https://github.com/quojs/quojs/blob/main/packages/core/README.md)** -- Store, middleware, effets, matchers `When`
- **[API @quojs/react](https://github.com/quojs/quojs/blob/main/packages/react/README.md)** -- Hooks avec abonnements fins

---

**Licence :** MIT
**Depot :** https://github.com/quojs/quojs
