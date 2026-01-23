![Quo.js logo](../../assets/logo.svg)

# Guia de Início Rápido

>[ 🇲🇽 Versión en Español](https://github.com/quojs/quojs/blob/main/docs/es/QUICK_START_GUIDE.md)&nbsp;
>|&nbsp; 👉 [ 🇵🇹 Versão Portuguesa](https://github.com/quojs/quojs/blob/main/docs/pt/QUICK_START_GUIDE.md)&nbsp;
>|&nbsp;[ 🇺🇸 English Version](https://github.com/quojs/quojs/blob/main/docs/en/QUICK_START_GUIDE.md)&nbsp;
>|&nbsp;[ 🇫🇷 Version française](https://github.com/quojs/quojs/blob/main/docs/fr/QUICK_START_GUIDE.md)

### 1. Instale o Quo.js

`quojs/react` só é necessário ao usar o React.


```bash
npm install @quojs/core @quojs/react
# ou
yarn add @quojs/core @quojs/react
# ou
pnpm add @quojs/core @quojs/react
```

## 2. Defina Seu Mapa de Eventos

```typescript
// Mapa de eventos: canais → tipos de eventos → payloads
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

## 3. Crie Reducers

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

## 4. Crie o Store

```typescript
import { createStore } from '@quojs/core';

const store = createStore({
  name: 'MyApp',
  reducer: {
    counter: counterReducer,
    // ... outros reducers
  }
});
```

## 5. Emita Eventos

```typescript
// Emita eventos (async)
await store.emit('counter', 'increment', 5);
await store.emit('counter', 'decrement', 2);
await store.emit('counter', 'reset', null);

// Obtenha o estado atual
const state = store.getState();
console.log(state.counter.value); // 0
```

## 6. Inscreva-se em Mudanças

```typescript
// Granularidade grossa: Inscreva-se em qualquer mudança de estado
const unsubscribe = store.subscribe(() => {
  console.log('Estado mudou:', store.getState());
});

// Granularidade fina: Inscreva-se em um caminho específico
const unsubscribePath = store.connect(
  { reducer: 'counter', property: 'value' },
  (change) => {
    console.log('Valor do contador mudou:', change.oldValue, '→', change.newValue);
  }
);

// Limpeza
unsubscribe();
unsubscribePath();
```


### 7. Use no React (opcional)

Consulte o **[arquivo readme do @quojs/react](https://github.com/quojs/quojs/blob/main/packages/react/README.pt.md)**.

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

## 8. Assinaturas de Eventos (v0.7.0+)

As assinaturas de eventos permitem que você reaja a eventos sem selecionar estado. Isso é útil para:
- Mostrar notificações em certos eventos
- Acionar animações
- Logging/analíticas
- Responder a eventos rejeitados (não confirmados)

### Fases de Eventos

- **`'committed'`** (padrão): Eventos que passaram pelo middleware e chegaram aos reducers
- **`'uncommitted'`**: Eventos rejeitados pelo middleware
- **`'all'`**: Ambos eventos confirmados e não confirmados

### Uso no Core

```typescript
// Assinar eventos confirmados (padrão)
const unsubscribe = store.onEvent('ui', 'save', (event, getState, emit, phase) => {
  console.log('Salvamento confirmado:', event.payload);
});

// Assinar eventos rejeitados
store.onEvent('ui', 'delete', (event, getState, emit, phase) => {
  console.log('Exclusão foi rejeitada pelo middleware');
}, 'uncommitted');

// Assinar todos os eventos (confirmados e não confirmados)
store.onEvent('ui', 'action', (event, getState, emit, phase) => {
  console.log('Ação:', phase); // 'committed' ou 'uncommitted'
}, 'all');

// Limpeza
unsubscribe();
```

### Hook React

```tsx
import { useEvent } from '@quojs/react';

function SaveNotification() {
  useEvent('ui', 'save', (event, getState, emit, phase) => {
    showToast('Salvo com sucesso!');
  });

  // Para eventos rejeitados
  useEvent('ui', 'delete', (event, getState, emit, phase) => {
    showToast('Exclusão foi bloqueada');
  }, 'uncommitted');

  return null;
}
```