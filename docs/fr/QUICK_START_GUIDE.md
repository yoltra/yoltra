![Quo.js logo](../../assets/logo.svg)

# Guide de Démarrage Rapide

>[ 🇲🇽 Versión en Español](https://github.com/quojs/quojs/blob/main/docs/es/QUICK_START_GUIDE.md)&nbsp;
>|&nbsp;[ 🇵🇹 Versão Portuguesa](https://github.com/quojs/quojs/blob/main/docs/pt/QUICK_START_GUIDE.md)&nbsp;
>|&nbsp;[ 🇺🇸 English Version](https://github.com/quojs/quojs/blob/main/docs/en/QUICK_START_GUIDE.md)&nbsp;
>|&nbsp; 👉 [ 🇫🇷 Version française](https://github.com/quojs/quojs/blob/main/docs/fr/QUICK_START_GUIDE.md)


## 1. Installer Quo.js

`quojs/react` n'est requis que lors de l'utilisation de React.

```bash
npm install @quojs/core @quojs/react
# ou
yarn add @quojs/core @quojs/react
# ou
pnpm add @quojs/core @quojs/react
```

## 2. Définissez Votre Carte d'Événements

```typescript
// Carte d'événements : canaux → types d'événements → payloads
type AppEM = {
  counter: {
    increment: number;
    decrement: number;
    reset: null;
  };
  todos: {
    add: { id: string; title: string };
    toggle: { id: string };
    delete: { id: string };
  };
};
```

## 3. Créez des Reducers

```typescript
import type { ReducerSpec } from '@quojs/core';

const counterReducer: ReducerSpec<{ value: number }, AppEM> = {
  state: { value: 0 },
  events: [
    ['counter', 'increment'],
    ['counter', 'decrement'],
    ['counter', 'reset']
  ],
  reducer: (state, event) => {
    switch (event.type) {
      case 'increment':
        return { value: state.value + event.payload };
      case 'decrement':
        return { value: state.value - event.payload };
      case 'reset':
        return { value: 0 };
      default:
        return state;
    }
  }
};
```

## 4. Créez le Store

```typescript
import { createStore } from '@quojs/core';

const store = createStore({
  name: 'MyApp',
  reducer: {
    counter: counterReducer,
    // ... autres reducers
  }
});
```

## 5. Émettez des Événements

```typescript
// Émettez des événements (async)
await store.emit('counter', 'increment', 5);
await store.emit('counter', 'decrement', 2);
await store.emit('counter', 'reset', null);

// Obtenez l'état actuel
const state = store.getState();
console.log(state.counter.value); // 0
```

## 6. Abonnez-vous aux Changements

```typescript
// Granularité grossière : Abonnez-vous à tout changement d'état
const unsubscribe = store.subscribe(() => {
  console.log('État changé :', store.getState());
});

// Granularité fine : Abonnez-vous à un chemin spécifique
const unsubscribePath = store.connect(
  { reducer: 'counter', property: 'value' },
  (change) => {
    console.log('Valeur du compteur changée :', change.oldValue, '→', change.newValue);
  }
);

// Nettoyage
unsubscribe();
unsubscribePath();
```

## 7. Utilisation dans React (facultatif)

Consultez le **[fichier readme de @quojs/react](https://github.com/quojs/quojs/blob/main/packages/react/README.fr.md)**.

```tsx
// App.tsx
import { StoreProvider } from '@quojs/react';
import { store } from './store';

function App() {
  return (
    <StoreProvider store={store}>
      <YourApp />
    </StoreProvider>
  );
}
```