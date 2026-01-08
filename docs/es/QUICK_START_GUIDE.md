![Quo.js logo](../../assets/logo.svg)

# Guía de Inicio Rápido

> 👉 [ 🇲🇽 Versión en Español](https://github.com/quojs/quojs/blob/main/docs/es/QUICK_START_GUIDE.md)&nbsp;
>|&nbsp;[ 🇵🇹 Versão Portuguesa](https://github.com/quojs/quojs/blob/main/docs/pt/QUICK_START_GUIDE.md)&nbsp;
>|&nbsp;[ 🇺🇸 English Version](https://github.com/quojs/quojs/blob/main/docs/en/QUICK_START_GUIDE.md)&nbsp;
>|&nbsp;[ 🇫🇷 Version française](https://github.com/quojs/quojs/blob/main/docs/fr/QUICK_START_GUIDE.md)


### 1. Instala Quo.js

`quojs/react` solo es requerido cuando usas React.

```bash
npm install @quojs/core @quojs/react
# o
yarn add @quojs/core @quojs/react
# o
pnpm add @quojs/core @quojs/react
```

## 2. Define Tu Mapa de Eventos

```typescript
// Mapa de eventos: canales → tipos de eventos → payloads
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

## 3. Crea Reducers

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

## 4. Crea el Store

```typescript
import { createStore } from '@quojs/core';

const store = createStore({
  name: 'MyApp',
  reducer: {
    counter: counterReducer,
    // ... otros reducers
  }
});
```

## 5. Emite Eventos

```typescript
// Emite eventos (async)
await store.emit('counter', 'increment', 5);
await store.emit('counter', 'decrement', 2);
await store.emit('counter', 'reset', null);

// Obtén el estado actual
const state = store.getState();
console.log(state.counter.value); // 0
```

## 6. Suscríbete a Cambios

```typescript
// Grano grueso: Suscríbete a cualquier cambio de estado
const unsubscribe = store.subscribe(() => {
  console.log('Estado cambió:', store.getState());
});

// Grano fino: Suscríbete a una ruta específica
const unsubscribePath = store.connect(
  { reducer: 'counter', property: 'value' },
  (change) => {
    console.log('Valor del contador cambió:', change.oldValue, '→', change.newValue);
  }
);

// Limpieza
unsubscribe();
unsubscribePath();
```

### 7. Usalo en React (opcional)

Revisa el **[archivo "leéme" de @quojs/react](https://github.com/quojs/quojs/blob/main/packages/react/README.es.md)**.

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