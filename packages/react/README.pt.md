# @quojs/react

> [ 🇲🇽 Versión en Español](./README.es.md)&nbsp; |
> &nbsp; 👉 [ 🇵🇹 Versão Portuguesa](./README.pt.md)&nbsp; | &nbsp;
> [ 🇺🇸 English Version](./README.md)&nbsp; | &nbsp;[ 🇫🇷 Version française](./README.fr.md)

![Tamanho do bundle](https://badgen.net/bundlephobia/min/@quojs/react)
![Tamanho do bundle](https://badgen.net/bundlephobia/minzip/@quojs/react)
![Tamanho do bundle](https://badgen.net/bundlephobia/tree-shaking/@quojs/react)
![Tamanho do bundle](https://badgen.net/bundlephobia/dependency-count/@quojs/react)
![Versão npm](https://badgen.net/npm/v/@quojs/react)
![Downloads npm](https://badgen.net/npm/dm/@quojs/react)
![Licença](https://badgen.net/npm/license/@quojs/react)

**Hooks React para [Quo.js](https://github.com/quojs/quojs/blob/main/README.md) com assinaturas de caminho de granularidade fina.**

Assine `"items.0.title"` ou `"items.*.done"` — o componente re-renderiza somente quando esse caminho exato muda. Sem seletores, sem memoização, sem otimização manual.

[Veja a comparação de flamegraph (Redux vs Quo.js).](https://github.com/quojs/quojs/blob/main/examples/v0/quojs-in-react/redux-quojs-profiler.md)

---

## Instalação

```bash
npm install @quojs/core @quojs/react
```

**Dependências peer:** React 18+

---

## Configuração com `createQuoHooks` (recomendado)

`createQuoHooks` vincula hooks totalmente tipados ao contexto do seu store. Todos os parâmetros de tipo são inferidos — nenhum generic explícito é necessário nos componentes.

### 1. Defina tipos e store

```typescript
// store.ts
import { createStore, eventKeys } from '@quojs/core';

export type AppEM = {
  counter: { increment: number; decrement: number; reset: null };
};

export type AppState = { counter: { value: number } };

export const store = createStore<AppState, AppEM>({
  name: 'App',
  reducer: {
    counter: {
      state: { value: 0 },
      when: { keys: eventKeys<AppEM>()([
        ['counter', 'increment'],
        ['counter', 'decrement'],
        ['counter', 'reset'],
      ])},
      reducer: (state, event) => {
        switch (event.type) {
          case 'increment': return { value: state.value + event.payload };
          case 'decrement': return { value: state.value - event.payload };
          case 'reset':     return { value: 0 };
          default:          return state;
        }
      },
    },
  },
});
```

### 2. Crie hooks tipados

```typescript
// hooks.ts
import { createContext } from 'react';
import { createQuoHooks } from '@quojs/react';
import type { StoreInstance } from '@quojs/core';
import type { AppState, AppEM } from './store';

export const AppStoreContext = createContext<
  StoreInstance<'counter', AppState, AppEM> | null
>(null);

export const {
  useStore,
  useEmit,
  useSelector,
  useAtomicProp,
  useAtomicProps,
  useEvent,
  shallowEqual,
} = createQuoHooks(AppStoreContext);
```

### 3. Forneça e use

```tsx
// App.tsx
import { store } from './store';
import { AppStoreContext, useAtomicProp, useEmit } from './hooks';

function Counter() {
  const value = useAtomicProp({ reducer: 'counter', property: 'value' });
  const emit = useEmit();

  return (
    <div>
      <h1>Count: {value}</h1>
      <button onClick={() => emit('counter', 'increment', 1)}>+</button>
      <button onClick={() => emit('counter', 'decrement', 1)}>-</button>
      <button onClick={() => emit('counter', 'reset', null)}>Reset</button>
    </div>
  );
}

export function App() {
  return (
    <AppStoreContext.Provider value={store}>
      <Counter />
    </AppStoreContext.Provider>
  );
}
```

---

## API de Hooks

### `useAtomicProp({ reducer, property }, map?, isEqual?)`

Seletor de caminho único de granularidade fina. Re-renderiza somente quando o caminho especificado muda.

```tsx
// Exact path — re-renders when items[0].title changes
const title = useAtomicProp({
  reducer: 'todos',
  property: 'items.0.title',
});

// With mapper — derive a value from the path
const count = useAtomicProp(
  { reducer: 'todos', property: 'items' },
  (items) => items.length,
);

// Wildcard pattern — re-renders when any item changes
const allTitles = useAtomicProp(
  { reducer: 'todos', property: 'items.**' },
  (state) => state.items.map(t => t.title),
  shallowEqual,
);
```

**Padrões suportados:**
- `"items.0.title"` — caminho exato (incluindo índices numéricos de array)
- `"items.*.title"` — `*` corresponde a um segmento
- `"items.**"` — `**` corresponde a zero ou mais segmentos

---

### `useAtomicProps(specs, selector, isEqual?)`

Seletor multi-caminho. Assina vários caminhos e recalcula quando qualquer um muda.

```tsx
const filtered = useAtomicProps(
  [
    { reducer: 'todos', property: 'items.**' },
    { reducer: 'filter', property: 'q' },
  ],
  (state) => state.todos.items.filter(
    item => item.title.includes(state.filter.q)
  ),
  shallowEqual,
);
```

---

### `useEvent(channel, type, handler, phase?)`

Assina eventos do store a partir de um componente. Não afeta o fluxo de eventos — fire-and-forget.

```tsx
// Committed events (default) — events that passed middleware
useEvent('ui', 'save', (event) => {
  showToast('Saved!');
});

// Uncommitted events — events rejected by middleware
useEvent('ui', 'delete', (event) => {
  showToast('Delete was blocked by permissions');
}, 'uncommitted');

// All events — distinguish by phase
useEvent('ui', 'action', (event, getState, emit, phase) => {
  console.log(`Action ${phase}:`, event.type);
}, 'all');
```

**Fases:**
- `'committed'` (padrão) — eventos que passaram pelo middleware e chegaram aos reducers
- `'uncommitted'` — eventos rejeitados pelo middleware
- `'all'` — ambos, com o parâmetro `phase` para distinguir

---

### `useEmit()`

Retorna a função `emit` tipada do store (referência estável).

```tsx
const emit = useEmit();
await emit('counter', 'increment', 1);
```

---

### `useSelector(selector, isEqual?)`

Seletor de granularidade grossa via `useSyncExternalStore`. Re-renderiza quando o valor selecionado muda.

```tsx
const count = useSelector((state) => state.counter.value);
```

---

### `useStore()`

Retorna a instância do store. Lança erro se chamado fora de um provider.

```tsx
const store = useStore();
const state = store.getState();
```

---

## Hooks de Suspense

### `useSuspenseAtomicProp(spec, options)`

Versão compatível com Suspense de `useAtomicProp`. Lança uma promise enquanto carrega, capturada pelo `<Suspense>` mais próximo.

```tsx
function UserName({ userId }: { userId: string }) {
  const name = useSuspenseAtomicProp(
    { reducer: 'users', property: `byId.${userId}.name` },
    {
      load: async (name, slice) => name ?? (await fetchUser(userId)).name,
      staleTime: 30_000,
    },
  );
  return <span>{name}</span>;
}

// Usage
<Suspense fallback={<Spinner />}>
  <UserName userId="123" />
</Suspense>
```

### `useSuspenseAtomicProps(specs, options)`

Seletor Suspense multi-caminho.

```tsx
const stats = useSuspenseAtomicProps(
  [
    { reducer: 'orders', property: 'items.**' },
    { reducer: 'users', property: 'active' },
  ],
  { load: async (state) => computeDashboardStats(state) },
);
```

### Utilitários de cache

```typescript
import {
  invalidateAtomicProp,
  invalidateAtomicPropsByReducer,
  clearSuspenseCache,
} from '@quojs/react';

// Invalidate a specific path's cache
invalidateAtomicProp('users', 'byId.123.name');

// Invalidate all cache entries for a reducer
invalidateAtomicPropsByReducer('users');

// Clear everything
clearSuspenseCache();
```

---

## `shallowEqual`

Comparador de igualdade rasa de objetos. Use como argumento `isEqual` quando o valor derivado é um objeto simples:

```tsx
const todos = useAtomicProp(
  { reducer: 'todos', property: 'items.**' },
  (state) => state.items.map(t => ({ id: t.id, title: t.title })),
  shallowEqual,
);
```

---

## Desempenho: Antes e Depois

### Antes (granularidade grossa)

```tsx
// Every TodoItem re-renders when ANY todo changes
function TodoList() {
  const todos = useSelector(state => state.todos.items);
  return todos.map(todo => <TodoItem key={todo.id} todo={todo} />);
}
```

### Depois (granularidade fina com Quo.js)

```tsx
// Each TodoItem re-renders ONLY when its own data changes
function TodoItem({ index }: { index: number }) {
  const title = useAtomicProp({
    reducer: 'todos',
    property: `items.${index}.title`,
  });
  const done = useAtomicProp({
    reducer: 'todos',
    property: `items.${index}.done`,
  });
  return <div className={done ? 'done' : ''}>{title}</div>;
}
```

[Veja a comparação de flamegraph completa.](https://github.com/quojs/quojs/blob/main/examples/v0/quojs-in-react/redux-quojs-profiler.md)

---

## Compatibilidade com React 18+

- **Concurrent Mode:** Totalmente compatível. Todos os hooks usam `useSyncExternalStore`.
- **Strict Mode:** A deduplicação de eventos previne processamento duplo.
- **Suspense:** `useSuspenseAtomicProp` e `useSuspenseAtomicProps` lançam promises para boundaries `<Suspense>`.

---

## Exemplos

- **[App de Tarefas com Profiler](../../examples/v0/quojs-in-react)** — CRUD completo com comparação de flamegraph
- **[Logo Cinético (1000+ partículas)](../../examples/v0/quojs-kinetic-logo)** — Assinaturas independentes por círculo SVG
- **[Next.js 15 App Router](../../examples/v0/quojs-in-nextjs)** — SSR + alternador de tema

---

## Documentação

- **[README Raiz do Quo.js](https://github.com/quojs/quojs/blob/main/README.md)** — Visão geral e configuração rápida
- **[API do @quojs/core](https://github.com/quojs/quojs/blob/main/packages/core/README.md)** — Store, middleware, effects, matchers `When`
- **[Guia de Início Rápido](https://github.com/quojs/quojs/blob/main/docs/en/QUICK_START_GUIDE.md)** — Cinco passos para um app funcional
- **[Comparação de Bibliotecas](https://github.com/quojs/quojs/blob/main/docs/en/design/state-management-library-comparison.md)** — Comparação arquitetural

---

## Contribuindo

- [Raiz do Monorepo](../../)
- [Guia de Contribuição](../../CONTRIBUTING.md)

---

## Status

**Release Candidate (v0.7.0+)** — As APIs são estáveis, utilizadas em produção, mudanças menores possíveis antes da v1.0.

---

## Licença

**MIT** — Livre para uso em projetos comerciais e de código aberto.
