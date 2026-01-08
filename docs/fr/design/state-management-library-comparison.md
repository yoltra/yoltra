# Comparaison des Bibliothèques de Gestion d'État

> [ 🇲🇽 Versión en Español](https://github.com/quojs/quojs/blob/main/docs/es/design/state-management-library-comparison.md)&nbsp; |
> &nbsp;[ 🇵🇹 Versão Portuguesa](https://github.com/quojs/quojs/blob/main/docs/pt/design/state-management-library-comparison.md)&nbsp; |
> &nbsp;[ 🇺🇸 English Version](https://github.com/quojs/quojs/blob/main/docs/en/design/state-management-library-comparison.md)&nbsp; |
> &nbsp; 👉 [ 🇫🇷 Version française](https://github.com/quojs/quojs/blob/main/docs/fr/design/state-management-library-comparison.md)

**Version:** 0.5.0
**Dernière mise à jour:** Janvier 2026

## Aperçu

Ce document fournit une comparaison technique honnête de Quo.js par rapport aux bibliothèques populaires de gestion d'état. Chaque comparaison explore les différences architecturales, l'adéquation aux cas d'usage, les caractéristiques de performance et l'expérience développeur.

---

## Qu'est-ce que Quo.js?

**Quo.js est un conteneur d'état piloté par événements, async-first avec des abonnements atomiques.**

### Architecture Centrale

```typescript
// Piloté par événements: Les événements transitent par des canaux
emit('todo', 'addItem', { title: 'Acheter du lait' });

// Async-first: Middleware et effets asynchrones intégrés
const middleware = async (state, event, emit) => {
 await trackAnalytics(event);
 return true;
};

// Abonnements atomiques: S'abonner à des chemins d'état exacts
useAtomicProp({ reducer: 'todos', property: 'items.0.title' });
// ↑ Ne re-rend que quand items[0].title change
```

### Caractéristiques Clés

| Aspect | Description |
|--------|-------------|
| **Modèle Architectural** | Architecture pilotée par événements avec routage par canaux |
| **Modèle d'État** | Store centralisé avec slices avec espaces de noms |
| **Modèle d'Événements** | File FIFO avec événements `(channel, type, payload)` |
| **Modèle d'Abonnement** | Abonnements atomiques à grain fin via chemins à points |
| **Modèle Asynchrone** | Emit basé sur Promise + middleware async + effets |
| **Modèle d'Exécution** | Traitement d'événements sérialisé (un à la fois, dans l'ordre) |
| **Runtime** | Universel (navigateur + Node.js + Deno + Bun) |

### Quels Problèmes Quo.js Résout-il?

1. **Performance**: Élimine les re-rendus inutiles via abonnements atomiques de chemin
2. **Complexité**: Support async natif sans thunks/sagas/observables
3. **Organisation**: Événements basés sur canaux préviennent les collisions de noms de type d'action
4. **Prévisibilité**: Garanties strictes d'ordonnancement des événements assurent des transitions d'état déterministes
5. **Flexibilité**: Fonctionne dans les apps web, serveurs Node, outils CLI, microservices

---

## Redux Toolkit

### Modèle Conceptuel

**Redux Toolkit (RTK)** est l'ensemble d'outils officiel et opinionné de Redux qui réduit le code répétitif tout en maintenant les principes fondamentaux de Redux: flux de données unidirectionnel, mises à jour immutables et reducers purs.

```typescript
// Approche Redux Toolkit
const todosSlice = createSlice({
 name: 'todos',
 initialState: { items: [] },
 reducers: {
  addTodo: (state, action) => {
   state.items.push(action.payload); // Mutation avec Immer
  }
 }
});

// Async via thunks
const fetchTodos = createAsyncThunk('todos/fetch', async (url) => {
 const res = await fetch(url);
 return res.json();
});

// Utilisation
dispatch(addTodo({ id: 1, title: 'Acheter du lait' }));
dispatch(fetchTodos('/api/todos'));
```

**Architecture:**
- Store unique avec reducers de slice
- Types d'action plats (`'todos/addTodo'`)
- Reducers synchrones (Immer pour l'immutabilité)
- Async via thunks ou RTK Query
- Abonnements grossiers (re-rendu sur tout changement de slice sauf optimisation manuelle)

### Quand Redux Toolkit Excelle

✅ **Grandes équipes avec modèles Redux établis** 
Redux est éprouvé au combat à grande échelle. Si votre équipe connaît déjà Redux, RTK est le chemin de mise à niveau évident.

✅ **Récupération de données via RTK Query** 
RTK Query fournit mise en cache automatique, re-récupération et mises à jour optimistes—une solution complète de récupération de données.

✅ **Écosystème DevTools** 
Redux DevTools est mature, largement adopté et possède de nombreuses intégrations tierces.

✅ **Maturité de l'écosystème** 
Des milliers de middlewares, améliorateurs et outils disponibles. Des solutions existent pour chaque cas limite.

### Quand Quo.js Excelle

✅ **Optimisation de performance à grain fin** 
Les abonnements atomiques de Quo.js éliminent les re-rendus par défaut. RTK nécessite une optimisation manuelle de `useSelector`.

**Exemple:**
```typescript
// RTK: Le composant entier re-rend quand N'IMPORTE QUEL todo change
const todos = useSelector(state => state.todos.items);

// Quo.js: Ne re-rend que quand le titre de CE todo spécifique change
const title = useAtomicProp({ 
 reducer: 'todos', 
 property: 'items.0.title' 
});
```

✅ **Modèles async intégrés** 
Le middleware et les effets de Quo.js sont async par défaut. Pas de thunks, pas de configuration RTK Query.

**Exemple:**
```typescript
// Quo.js: Middleware async intégré
const middleware = async (state, event, emit) => {
 if (event.type === 'fetchTodos') {
  const data = await fetch('/api/todos').then(r => r.json());
  await emit('todos', 'loadSuccess', data);
  return false; // Annuler l'événement original
 }
 return true;
};

// RTK: Nécessite thunk/RTK Query
const fetchTodos = createAsyncThunk('todos/fetch', async () => {
 return fetch('/api/todos').then(r => r.json());
});
```

✅ **Organisation basée sur canaux** 
Les événements de Quo.js sont espacés par canal, évitant les collisions de noms dans les grandes apps.

**Exemple:**
```typescript
// Quo.js: Espaces de noms clairs
emit('user', 'update', data);
emit('analytics', 'track', event);
emit('api', 'request', config);

// RTK: Les types d'action plats nécessitent une dénomination soigneuse
dispatch({ type: 'user/update' });
dispatch({ type: 'analytics/track' });
dispatch({ type: 'api/request' });
```

✅ **Runtime universel** 
Quo.js n'a pas de dépendances DOM. Utilisez-le dans les serveurs Node.js, outils CLI ou microservices.

### Comparaison de Performance

| Métrique | Redux Toolkit | Quo.js |
|--------|---------------|--------|
| **Granularité d'Abonnement** | Niveau slice (optimisation manuelle) | Niveau chemin (automatique) |
| **Fréquence de Re-rendu** | Élevée (sans optimisation) | Minimale (atomique par défaut) |
| **Overhead Asynchrone** | Couche thunk + créateurs d'action | Pipeline async intégré |
| **Taille de Bundle** | ~45KB (RTK + React-Redux) | ~15KB (@quojs/core + @quojs/react) |
| **Empreinte Mémoire** | Plus élevée (abonnements à l'arbre d'état complet) | Plus faible (abonnements spécifiques au chemin) |

### Chemin de Migration: RTK → Quo.js

```typescript
// AVANT (Redux Toolkit)
const todosSlice = createSlice({
 name: 'todos',
 initialState: { items: [], filter: 'all' },
 reducers: {
  addTodo: (state, action) => {
   state.items.push(action.payload);
  },
  toggleTodo: (state, action) => {
   const todo = state.items.find(t => t.id === action.payload);
   if (todo) todo.completed = !todo.completed;
  }
 }
});

// APRÈS (Quo.js v0.5.0)
import { withImmer } from './withImmer';

const todosReducer = withImmer<TodoState, AppEM>((draft, event) => {
 switch (event.type) {
  case 'addTodo':
   draft.items.push(event.payload);
   return;
  case 'toggleTodo':
   const todo = draft.items.find(t => t.id === event.payload);
   if (todo) todo.completed = !todo.completed;
   return;
 }
});

const todosSpec: ReducerSpec<TodoState, AppEM> = {
 state: { items: [], filter: 'all' },
 events: [
  ['todos', 'addTodo'],
  ['todos', 'toggleTodo']
 ],
 reducer: todosReducer
};
```

### Verdict

**Choisissez Redux Toolkit si:**
- Votre équipe maîtrise déjà Redux
- Vous avez besoin des capacités de récupération de données de RTK Query
- Vous dépendez fortement de l'écosystème Redux
- Vous préférez les solutions opinionées et complètes

**Choisissez Quo.js si:**
- La performance (optimisation de re-rendu) est critique
- Vous voulez un support async natif sans couches
- Vous construisez des apps universelles (web + Node.js)
- Vous préférez des APIs explicites et minimales

---

## Zustand

### Modèle Conceptuel

**Zustand** est une bibliothèque de gestion d'état minimaliste construite sur les hooks React. Elle évite le code répétitif de Redux pour une simple API `create` + `set`.

```typescript
// Approche Zustand
const useStore = create((set) => ({
 todos: [],
 addTodo: (todo) => set((state) => ({ 
  todos: [...state.todos, todo] 
 })),
 toggleTodo: (id) => set((state) => ({
  todos: state.todos.map(t => 
   t.id === id ? { ...t, completed: !t.completed } : t
  )
 }))
}));

// Utilisation
const todos = useStore(state => state.todos);
const addTodo = useStore(state => state.addTodo);
```

**Architecture:**
- Store unique avec mises à jour directes d'état
- Pas d'actions ou événements (juste des fonctions)
- Synchrone par défaut
- Abonnements via fonctions de sélection
- Surface d'API minimale (~1KB)

### Quand Zustand Excelle

✅ **Code répétitif minimal** 
Zustand a la plus faible cérémonie de toute bibliothèque d'état. Définissez état + actions en un seul endroit.

✅ **Petite taille de bundle** 
~1KB rend Zustand idéal pour les apps avec contraintes de taille.

✅ **Modèle mental simple** 
Pas d'événements, pas de reducers, pas de middleware—juste des fonctions qui appellent `set()`.

✅ **Adoption graduelle** 
Facile à ajouter aux projets existants sans refactorisation majeure.

### Quand Quo.js Excelle

✅ **Complexité asynchrone** 
Quo.js gère les workflows async nativement. Zustand nécessite une orchestration manuelle.

**Exemple:**
```typescript
// Zustand: Gestion async manuelle
const useStore = create((set) => ({
 todos: [],
 loading: false,
 fetchTodos: async () => {
  set({ loading: true });
  try {
   const res = await fetch('/api/todos');
   const todos = await res.json();
   set({ todos, loading: false });
  } catch (error) {
   set({ loading: false, error });
  }
 }
}));

// Quo.js: Pipeline async intégré
const middleware = async (state, event, emit) => {
 if (event.type === 'fetchTodos') {
  await emit('todos', 'loading', true);
  try {
   const res = await fetch('/api/todos');
   const todos = await res.json();
   await emit('todos', 'loadSuccess', todos);
  } catch (error) {
   await emit('todos', 'loadFailure', error);
  }
  return false;
 }
 return true;
};
```

✅ **Garanties d'ordonnancement des événements** 
La file FIFO de Quo.js assure des transitions d'état déterministes. Les appels `set()` de Zustand peuvent s'entrelacer de manière imprévisible.

✅ **Abonnements à grain fin** 
Zustand nécessite une optimisation manuelle des sélecteurs. Les abonnements atomiques de Quo.js sont intégrés.

**Exemple:**
```typescript
// Zustand: Re-rend quand N'IMPORTE QUEL todo change (sans optimisation)
const todos = useStore(state => state.todos);

// Zustand optimisé: Sélecteur manuel
const firstTodo = useStore(
 state => state.todos[0],
 (a, b) => a?.id === b?.id // Égalité personnalisée
);

// Quo.js: Abonnement à grain fin automatique
const firstTodo = useAtomicProp({ 
 reducer: 'todos', 
 property: 'items.0' 
});
```

✅ **Historique d'événements structuré** 
Les événements de Quo.js sont de première classe, facilitant le débogage par voyage dans le temps et l'analytique.

### Comparaison de Performance

| Métrique | Zustand | Quo.js |
|--------|---------|--------|
| **Granularité d'Abonnement** | Niveau sélecteur (manuel) | Niveau chemin (automatique) |
| **Fréquence de Re-rendu** | Moyenne (avec optimisation) | Minimale (atomique par défaut) |
| **Taille de Bundle** | ~1KB | ~15KB |
| **Complexité de Configuration** | Minimale | Modérée |
| **Modèles Async** | Manuel | Intégrés |

### Chemin de Migration: Zustand → Quo.js

```typescript
// AVANT (Zustand)
const useStore = create((set) => ({
 count: 0,
 increment: () => set((state) => ({ count: state.count + 1 })),
 decrement: () => set((state) => ({ count: state.count - 1 }))
}));

// APRÈS (Quo.js v0.5.0)
const counterReducer = (state: CounterState, event: EventUnion<AppEM>) => {
 switch (event.type) {
  case 'increment':
   return { count: state.count + 1 };
  case 'decrement':
   return { count: state.count - 1 };
  default:
   return state;
 }
};

const store = createStore({
 name: 'App',
 reducer: {
  counter: {
   state: { count: 0 },
   events: [['counter', 'increment'], ['counter', 'decrement']],
   reducer: counterReducer
  }
 }
});

// Utilisation
const emit = useEmit();
emit('counter', 'increment', null);
```

### Verdict

**Choisissez Zustand si:**
- La taille de bundle est critique (<5KB total)
- Vous voulez l'API la plus simple possible
- Votre app a une complexité async minimale
- Vous construisez une petite à moyenne app

**Choisissez Quo.js si:**
- Vous avez besoin de modèles async robustes
- L'optimisation de performance est critique
- Vous voulez des garanties d'ordonnancement des événements
- Vous construisez une app grande et complexe

---

## Jotai

### Modèle Conceptuel

**Jotai** adopte une approche basée sur les atomes inspirée de Recoil. L'état est distribué entre les atomes au lieu d'être centralisé.

```typescript
// Approche Jotai
const countAtom = atom(0);
const todosAtom = atom([]);

// Atomes dérivés
const completedCountAtom = atom(
 (get) => get(todosAtom).filter(t => t.completed).length
);

// Utilisation
const [count, setCount] = useAtom(countAtom);
const todos = useAtomValue(todosAtom);
```

**Architecture:**
- État distribué (atomes)
- Composition ascendante
- Mises à jour atomiques (grain fin par conception)
- Suspense-first
- Pas de store central

### Quand Jotai Excelle

✅ **Réactivité à grain fin** 
Les atomes sont intrinsèquement granulaires. Les re-rendus sont minimaux par conception.

✅ **Intégration Suspense** 
Jotai a été construit pour Suspense dès le premier jour.

✅ **État composable** 
Les atomes peuvent dépendre d'autres atomes, créant des graphes d'état dérivé.

✅ **Pas de store global** 
Génial pour l'état au niveau du composant ou avec portée de fonctionnalité.

### Quand Quo.js Excelle

✅ **Modèle d'état centralisé** 
Quo.js maintient une source unique de vérité. Plus facile à raisonner pour les grandes apps.

✅ **Architecture pilotée par événements** 
Les événements de Quo.js créent une piste d'audit. Les mises à jour d'atomes de Jotai sont implicites.

**Exemple:**
```typescript
// Jotai: Mises à jour implicites
setCount(count + 1); // D'où vient cela? Qui l'a déclenché?

// Quo.js: Événements explicites
emit('counter', 'increment', 1); // Intention claire, traçable
```

✅ **Middleware et effets** 
Quo.js a un pipeline async central. Jotai nécessite une gestion des effets par atome.

✅ **Coordination d'état global** 
Quo.js excelle quand les mises à jour d'état doivent se coordonner entre plusieurs slices (ex., auth affectant l'état UI).

### Comparaison de Performance

| Métrique | Jotai | Quo.js |
|--------|-------|--------|
| **Granularité d'Abonnement** | Niveau atome (fin par conception) | Niveau chemin (fin par conception) |
| **Fréquence de Re-rendu** | Minimale | Minimale |
| **Taille de Bundle** | ~3KB | ~15KB |
| **Complexité de Configuration** | Faible | Modérée |
| **Modèle Mental** | Ascendant (atomes) | Descendant (événements) |

### Verdict

**Choisissez Jotai si:**
- Vous préférez l'état distribué basé sur atomes
- Vous construisez une app Suspense-first
- Vous voulez un code répétitif minimal
- L'état est surtout avec portée de composant

**Choisissez Quo.js si:**
- Vous préférez l'état centralisé
- Vous avez besoin d'architecture pilotée par événements
- Vous voulez middleware/effets pour préoccupations transversales
- La coordination d'état entre fonctionnalités est critique

---

## MobX

### Modèle Conceptuel

**MobX** utilise la programmation réactive avec des observables. Les changements d'état déclenchent automatiquement des mises à jour via des proxies.

```typescript
// Approche MobX
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

// Utilisation
const store = new TodoStore();
const App = observer(() => {
 return <div>{store.completedCount}</div>; // Auto-mise à jour
});
```

**Architecture:**
- État observable (proxies)
- Suivi automatique des dépendances
- Mises à jour mutables (suivies via proxies)
- Basé sur classes ou fonctionnel
- Grain fin par défaut

### Quand MobX Excelle

✅ **Réactivité implicite** 
MobX suit automatiquement les dépendances. Pas d'abonnements manuels.

✅ **Mises à jour de style mutable** 
Se sent comme du JavaScript simple. Pas besoin de modèles immutables.

✅ **Grain fin par défaut** 
Les composants ne re-rendent que quand leurs observables spécifiques changent.

✅ **Convivial pour POO** 
Adapté naturel pour les architectures basées sur classes.

### Quand Quo.js Excelle

✅ **Flux d'événements explicite** 
Les événements de Quo.js sont traçables. La réactivité de MobX est "magique" (plus difficile à déboguer).

✅ **Garanties d'immutabilité** 
Quo.js force les mises à jour immutables. MobX permet la mutation (sujet aux erreurs).

✅ **Débogage par voyage dans le temps** 
Les événements de Quo.js créent un historique rejouable. Les mutations de MobX sont plus difficiles à suivre.

✅ **Pipeline async** 
Quo.js a un flux async structuré. MobX nécessite une gestion manuelle de `runInAction`.

**Exemple:**
```typescript
// MobX: Gestion async manuelle
class Store {
 @observable loading = false;
 @observable data = null;
 
 @action
 async fetchData() {
  this.loading = true; // Doit envelopper dans action
  const res = await fetch('/api/data');
  runInAction(() => { // Doit envelopper continuation async
   this.data = await res.json();
   this.loading = false;
  });
 }
}

// Quo.js: Pipeline async intégré
const middleware = async (state, event, emit) => {
 if (event.type === 'fetchData') {
  await emit('data', 'loading', true);
  const res = await fetch('/api/data');
  const data = await res.json();
  await emit('data', 'loaded', data);
  return false;
 }
 return true;
};
```

### Comparaison de Performance

| Métrique | MobX | Quo.js |
|--------|------|--------|
| **Granularité d'Abonnement** | Niveau observable (fin) | Niveau chemin (fin) |
| **Fréquence de Re-rendu** | Minimale | Minimale |
| **Taille de Bundle** | ~16KB | ~15KB |
| **Courbe d'Apprentissage** | Modérée (modèle de réactivité) | Modérée (modèle d'événements) |
| **Débogage** | Plus difficile (implicite) | Plus facile (événements explicites) |

### Verdict

**Choisissez MobX si:**
- Vous préférez la programmation réactive
- Vous aimez les mises à jour de style mutable
- Vous construisez une app avec beaucoup de POO
- Vous voulez un code répétitif minimal

**Choisissez Quo.js si:**
- Vous préférez le flux d'événements explicite
- Vous voulez des garanties d'immutabilité
- Vous avez besoin de débogage par voyage dans le temps
- Vous voulez des modèles async structurés

---

## XState

### Modèle Conceptuel

**XState** modélise l'état comme des machines à états finis (FSM). Les transitions d'état sont explicites et gouvernées par des définitions de machine.

```typescript
// Approche XState
const todoMachine = createMachine({
 id: 'todo',
 initial: 'idle',
 states: {
  idle: {
   on: {
    FETCH: 'loading'
   }
  },
  loading: {
   invoke: {
    src: 'fetchTodos',
    onDone: {
     target: 'success',
     actions: 'assignTodos'
    },
    onError: 'failure'
   }
  },
  success: { /* ... */ },
  failure: { /* ... */ }
 }
});

const [state, send] = useMachine(todoMachine);
```

**Architecture:**
- Machines à états
- Transitions d'état explicites
- Modèle d'acteur (boîtes aux lettres pour messages)
- Diagrammes visuels
- Orchestration async complexe

### Quand XState Excelle

✅ **Machines à états complexes** 
XState excelle quand les transitions d'état sont nombreuses et conditionnelles (ex., flux de checkout, formulaires multi-étapes).

✅ **Modélisation visuelle** 
Les machines XState peuvent être visualisées comme diagrammes, constituant une excellente documentation.

✅ **Prévention des états impossibles** 
XState rend les transitions d'état invalides impossibles par conception.

✅ **Modèle d'acteur** 
Génial pour coordonner plusieurs processus concurrents.

### Quand Quo.js Excelle

✅ **Modèle mental plus simple** 
L'approche pilotée par événements de Quo.js est plus facile à comprendre pour les apps typiques. Les FSM de XState ont une courbe d'apprentissage raide.

✅ **État à usage général** 
Quo.js est meilleur pour les apps CRUD où l'état n'est pas strictement une "machine". XState est excessif pour la gestion de données simple.

✅ **Moins de code répétitif** 
Les machines XState sont verbeuses. Les événements et reducers de Quo.js sont plus concis.

**Exemple:**
```typescript
// XState: Définition de machine verbeuse
const machine = createMachine({
 id: 'counter',
 initial: 'active',
 context: { count: 0 },
 states: {
  active: {
   on: {
    INCREMENT: {
     actions: assign({ count: (ctx) => ctx.count + 1 })
    },
    DECREMENT: {
     actions: assign({ count: (ctx) => ctx.count - 1 })
    }
   }
  }
 }
});

// Quo.js: Reducer concis
const counterReducer = (state, event) => {
 switch (event.type) {
  case 'increment':
   return { count: state.count + 1 };
  case 'decrement':
   return { count: state.count - 1 };
  default:
   return state;
 }
};
```

### Comparaison de Performance

| Métrique | XState | Quo.js |
|--------|--------|--------|
| **Adéquation au Cas d'Usage** | Workflows complexes | Gestion d'état générale |
| **Taille de Bundle** | ~30KB | ~15KB |
| **Courbe d'Apprentissage** | Raide (concepts FSM) | Modérée (modèle d'événements) |
| **Code Répétitif** | Élevé (définitions de machine) | Faible (reducers) |
| **Visualisation** | Excellente (diagrammes) | Aucune (événements uniquement) |

### Verdict

**Choisissez XState si:**
- Vous modélisez des workflows complexes (checkout, wizards, jeux)
- Vous avez besoin de diagrammes d'état visuels
- Vous voulez éliminer les états impossibles
- Vous êtes à l'aise avec les concepts de machine à états

**Choisissez Quo.js si:**
- Vous construisez des apps CRUD typiques
- Vous voulez un modèle mental plus simple
- Vous avez besoin de gestion d'état à usage général
- Vous voulez moins de code répétitif

---

## Tableau Récapitulatif

| Fonctionnalité | Redux Toolkit | Zustand | Jotai | MobX | XState | Quo.js |
|---------|---------------|---------|-------|------|--------|--------|
| **Architecture** | Centralisée | Centralisée | Distribuée | Observable | FSM | Centralisée + Événements |
| **Support Async** | Thunks/RTK Query | Manuel | Manuel | `runInAction` | Intégré | Intégré |
| **Abonnements** | Niveau slice | Niveau sélecteur | Niveau atome | Niveau observable | Niveau état | Niveau chemin |
| **Taille de Bundle** | ~45KB | ~1KB | ~3KB | ~16KB | ~30KB | ~15KB |
| **Courbe d'Apprentissage** | Modérée | Faible | Faible-Modérée | Modérée | Raide | Modérée |
| **Code Répétitif** | Moyen | Minimal | Minimal | Minimal | Élevé | Faible-Moyen |
| **DevTools** | Excellent | Bon | Bon | Bon | Excellent | Bon |
| **TypeScript** | Excellent | Bon | Excellent | Bon | Excellent | Excellent |
| **Immutabilité** | Forcée (Immer) | Manuelle | Forcée | Optionnelle (proxies) | Forcée | Forcée |
| **Ordonnancement Événements** | Sync | Aucun | Aucun | Aucun | Explicite | File FIFO |
| **Support Node.js** | Oui | Non | Non | Oui | Oui | Oui |

---

## Matrice de Décision

### Choisissez Quo.js si vous avez besoin de:

✅ **Performance à grain fin** sans optimisation manuelle 
✅ **Support async natif** sans bibliothèques externes 
✅ **Architecture pilotée par événements** avec garanties d'ordonnancement 
✅ **Runtime universel** (web + Node.js + Deno + Bun) 
✅ **Événements explicites et traçables** pour le débogage 
✅ **Organisation basée sur canaux** pour grandes apps 

### Choisissez Redux Toolkit si vous avez besoin de:

✅ Écosystème mature avec outils extensifs 
✅ RTK Query pour récupération de données 
✅ Familiarité de l'équipe avec modèles Redux 
✅ Débogage par voyage dans le temps avec Redux DevTools 

### Choisissez Zustand si vous avez besoin de:

✅ Taille de bundle minimale (<5KB total) 
✅ API simple avec zéro code répétitif 
✅ Adoption graduelle dans apps existantes 

### Choisissez Jotai si vous avez besoin de:

✅ État distribué basé sur atomes 
✅ Architecture Suspense-first 
✅ Composition d'état ascendante 

### Choisissez MobX si vous avez besoin de:

✅ Modèle de programmation réactive 
✅ Mises à jour de style mutable 
✅ Architecture basée sur classes 

### Choisissez XState si vous avez besoin de:

✅ Machines à états finis 
✅ Modélisation de workflows complexes 
✅ Diagrammes d'état visuels 

---

## Conclusion

Quo.js occupe une position unique dans le paysage de gestion d'état:

- **Plus structuré que Zustand** (événements + canaux vs. mises à jour directes)
- **Plus performant que Redux** (abonnements atomiques par défaut)
- **Plus explicite que Jotai** (store centralisé vs. atomes distribués)
- **Plus débogable que MobX** (événements explicites vs. réactivité implicite)
- **Plus accessible que XState** (usage général vs. machines à états)

Si vous valorisez **flux d'événements explicite**, **performance à grain fin**, **support async natif** et **compatibilité runtime universelle**, Quo.js vaut la peine d'être évalué.

---

**Lectures Complémentaires:**
- [Architecture de File d'Événements](./event-queue-architecture.md) - Plongée technique profonde dans la file async de Quo.js
- [Guide de Démarrage Rapide](https://quojs.dev) - Commencez en 5 minutes
- [Référence API](https://github.com/quojs/quojs/blob/main/packages/core/docs/README.md) - Documentation TypeDoc complète

---

**Historique des Révisions**

| Version | Date | Changements |
|---------|------|---------|
| 0.5.0 | 2026-01 | Comparaison exhaustive initiale |

---

**Licence:** MIT 
**Dépôt:** https://github.com/quojs/quo 
**Site Web:** https://quojs.dev