![Quo.js logo](../../assets/logo.svg)

# Quick Start Guide

> [ 🇲🇽 Versión en Español](https://github.com/quojs/quojs/blob/main/docs/es/QUICK_START_GUIDE.md)&nbsp; |
> &nbsp;[ 🇵🇹 Versão Portuguesa](https://github.com/quojs/quojs/blob/main/docs/pt/QUICK_START_GUIDE.md)&nbsp; |
> &nbsp; 👉 [ 🇺🇸 English Version](https://github.com/quojs/quojs/blob/main/docs/en/QUICK_START_GUIDE.md)&nbsp; |
> &nbsp;[ 🇫🇷 Version française](https://github.com/quojs/quojs/blob/main/docs/fr/QUICK_START_GUIDE.md)


### 1. Install Quo.js

`quojs/react` is only required when using React.

```bash
npm install @quojs/core @quojs/react
# or
yarn add @quojs/core @quojs/react
# or
pnpm add @quojs/core @quojs/react
```

## 2. Define Your Event Map

```typescript
// Event map: channels → event types → payloads
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

## 3. Create Reducers

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

## 4. Create the Store

```typescript
import { createStore } from '@quojs/core';

const store = createStore({
  name: 'Quo.js Store',
  reducer: {
    counter: counterReducer,
    // ... other reducers
  }
});
```

## 5. Emit Events

```typescript
// Emit events (async)
await store.emit('counter', 'increment', 5);
await store.emit('counter', 'decrement', 2);
await store.emit('counter', 'reset', null);

// Get current state
const state = store.getState();
console.log(state.counter.value); // 0
```

## 6. Subscribe to Changes

```typescript
// Coarse-grained: Subscribe to any state change
const unsubscribe = store.subscribe(() => {
  console.log('State changed:', store.getState());
});

// Fine-grained: Subscribe to specific path
const unsubscribePath = store.connect(
  { reducer: 'counter', property: 'value' },
  (change) => {
    console.log('Counter value changed:', change.oldValue, '→', change.newValue);
  }
);

// Cleanup
unsubscribe();
unsubscribePath();
```

### 7. Use in React (optional)

Check the **[@quojs/react readme file](https://github.com/quojs/quojs/blob/main/packages/react/README.md)**.

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

## 8. Event Subscriptions (v0.7.0+)

Event subscriptions allow you to react to events without selecting state. This is useful for:
- Showing notifications on certain events
- Triggering animations
- Logging/analytics
- Responding to rejected (uncommitted) events

### Event Phases

- **`'committed'`** (default): Events that passed middleware and reached reducers
- **`'uncommitted'`**: Events rejected by middleware
- **`'all'`**: Both committed and uncommitted events

### Core Usage

```typescript
// Subscribe to committed events (default)
const unsubscribe = store.onEvent('ui', 'save', (event, getState, emit, phase) => {
  console.log('Save committed:', event.payload);
});

// Subscribe to rejected events
store.onEvent('ui', 'delete', (event, getState, emit, phase) => {
  console.log('Delete was rejected by middleware');
}, 'uncommitted');

// Subscribe to all events (both committed and uncommitted)
store.onEvent('ui', 'action', (event, getState, emit, phase) => {
  console.log('Action:', phase); // 'committed' or 'uncommitted'
}, 'all');

// Cleanup
unsubscribe();
```

### React Hook

```tsx
import { useEvent } from '@quojs/react';

function SaveNotification() {
  useEvent('ui', 'save', (event, getState, emit, phase) => {
    showToast('Saved successfully!');
  });

  // For rejected events
  useEvent('ui', 'delete', (event, getState, emit, phase) => {
    showToast('Delete was blocked');
  }, 'uncommitted');

  return null;
}
```