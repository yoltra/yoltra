![Tamanho do bundle](https://badgen.net/bundlephobia/min/@quojs/react)
![Tamanho do bundle](https://badgen.net/bundlephobia/minzip/@quojs/react)
![Tamanho do bundle](https://badgen.net/bundlephobia/tree-shaking/@quojs/react)
![Tamanho do bundle](https://badgen.net/bundlephobia/dependency-count/@quojs/react)
![Versão npm](https://badgen.net/npm/v/@quojs/react)
![Downloads npm](https://badgen.net/npm/dm/@quojs/react)
![Licença](https://badgen.net/npm/license/@quojs/react)

**Bindings React para Quo.js com assinaturas atômicas.**

`@quojs/react` fornece hooks e componentes React para Quo.js, apresentando **controle de re-renderização de granularidade fina**, **suporte para Suspense** e **compatibilidade com Concurrent Mode**.

**Zero re-renderizações desnecessárias por padrão.**

---

## O que é @quojs/react?

Companheiro oficial do React para **[@quojs/core](https://github.com/quojs/quojs/blob/main/packages/core/README.pt.md)**—um contêiner de estado orientado a eventos com:

- **Assinaturas atômicas** — Inscreva-se em caminhos de estado exatos, somente re-renderiza quando eles mudam
- **Suporte nativo para async** — Middleware e effects integrados, sem thunks/sagas
- **Eventos baseados em canais** — Organize eventos por canal para prevenir colisões de nomes
- **Garantias de imutabilidade** — Aplicação de deep-freeze com detecção precisa de mudanças

---

## Recursos Principais

- 🎯 **Props Atômicas** — `useAtomicProp` inscreve-se em caminhos exatos (`'todos.items.0.title'`)
- ⚡ **Zero Renderizações Desperdiçadas** — Somente re-renderiza quando os caminhos inscritos realmente mudam
- 🔮 **Pronto para Suspense** — `useSuspenseAtomicProp` para padrões de busca de dados
- 🧩 **Concurrent Mode** — Totalmente compatível com recursos concorrentes do React 18+
- 🛡️ **TypeScript-First** — Excelente inferência de tipos e autocompletar
- 📌 **Leve** — ~7KB (minificado + gzipped)

---

## Instalação

```bash
npm install @quojs/core @quojs/react
# ou
yarn add @quojs/core @quojs/react
# ou
pnpm add @quojs/core @quojs/react
```

**Dependências peer:** React 18+ (testado com React 18 e 19)

---

## Início Rápido

### 1. Crie Seu Store

```typescript
// store.ts
import { createStore } from '@quojs/core';

export type AppEM = {
  counter: {
    increment: number;
    decrement: number;
    reset: null;
  };
};

export const store = createStore({
  name: 'App',
  reducer: {
    counter: {
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
    }
  }
});

export type AppStore = typeof store;
```

### 2. Crie o Contexto do Store

```typescript
// StoreContext.ts
import { createContext } from 'react';
import type { AppStore } from './store';

export const StoreContext = createContext<AppStore | null>(null);
```

### 3. Crie Hooks Tipados

```typescript
// hooks.ts
import { createQuoHooks } from '@quojs/react';
import { StoreContext } from './StoreContext';
import type { AppEM } from './store';

export const {
  useStore,
  useEmit,
  useSelector,
  useAtomicProp,
  useAtomicProps,
  shallowEqual,
} = createQuoHooks<'counter', AppState, AppEM>(StoreContext);
```

### 4. Forneça o Store

```tsx
// App.tsx
import { StoreProvider } from '@quojs/react';
import { store } from './store';
import { Counter } from './Counter';

export function App() {
  return (
    <StoreProvider store={store}>
      <Counter />
    </StoreProvider>
  );
}
```

### 5. Use Hooks em Componentes

```tsx
// Counter.tsx
import { useAtomicProp, useEmit } from './hooks';

export function Counter() {
  // Somente re-renderiza quando counter.value muda
  const value = useAtomicProp({ reducer: 'counter', property: 'value' });
  const emit = useEmit();

  return (
    <div>
      <h1>Contador: {value}</h1>
      <button onClick={() => emit('counter', 'increment', 1)}>+</button>
      <button onClick={() => emit('counter', 'decrement', 1)}>-</button>
      <button onClick={() => emit('counter', 'reset', null)}>Reiniciar</button>
    </div>
  );
}
```

---

## Referência da API

### Componentes

#### `<StoreProvider>`

Fornece o store do Quo.js aos componentes React através do contexto.

```tsx
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

---

### Hooks

#### `useStore()`

Retorna a instância do store.

```tsx
const store = useStore();
const state = store.getState();
```

---

#### `useEmit()`

Retorna a função `emit` tipada.

```tsx
const emit = useEmit();

// Emita eventos (completamente tipado)
await emit('counter', 'increment', 1);
await emit('todos', 'add', { id: '1', title: 'Comprar leite' });
```

**Substitui:** `useDispatch()` (depreciado na v0.5.0)

---

#### `useSelector(selector, isEqual?)`

Seleciona estado derivado através de uma função seletora.

```tsx
const count = useSelector((state) => state.counter.value);

// Com igualdade personalizada
import { shallowEqual } from './hooks';

const todos = useSelector(
  (state) => state.todos.items,
  shallowEqual
);
```

**Re-renderiza:** Quando o valor selecionado muda (conforme `isEqual`)

---

#### `useAtomicProp({ reducer, property })`

**O recurso matador.** Inscreve-se em um caminho de estado específico—somente re-renderiza quando esse caminho exato muda.

```tsx
// Somente re-renderiza quando items[0].title muda
const title = useAtomicProp({ 
  reducer: 'todos', 
  property: 'items.0.title' 
});

// Com função mapper
const count = useAtomicProp(
  { reducer: 'todos', property: 'items' },
  (items) => items.length
);

// Padrões wildcard
const allTitles = useAtomicProp(
  { reducer: 'todos', property: 'items.*.title' },
  (state) => state.items.map(t => t.title)
);
```

**Benefícios:**
- ✅ Zero re-renderizações desnecessárias
- ✅ Nenhuma otimização manual necessária
- ✅ Funciona com caminhos profundos e wildcards

---

#### `useAtomicProps(specs, selector, isEqual?)`

Inscreve-se em múltiplos caminhos, recalcula o seletor quando qualquer um muda.

```tsx
const filtered = useAtomicProps(
  [
    { reducer: 'todos', property: 'items.**' },
    { reducer: 'todos', property: 'filter' }
  ],
  (state) => {
    return state.todos.items.filter(
      item => item.status === state.todos.filter
    );
  },
  shallowEqual
);
```

**Caso de uso:** Estado derivado que depende de múltiplos slices

---

#### `useSuspenseAtomicProp({ reducer, property }, options)`

Versão habilitada para Suspense de `useAtomicProp`.

```tsx
const user = useSuspenseAtomicProp(
  { reducer: 'user', property: 'profile' },
  {
    load: async (profile) => {
      if (!profile) {
        const res = await fetch('/api/user');
        return res.json();
      }
      return profile;
    },
    staleTime: 60000, // 1 minuto
  }
);

// O componente suspende enquanto carrega
```

**Recursos:**
- Gerenciamento automático de cache
- Tempo de obsolescência configurável
- Funciona com limites de `<Suspense>`

---

#### `useSuspenseAtomicProps(specs, options)`

Versão habilitada para Suspense de `useAtomicProps`.

```tsx
const data = useSuspenseAtomicProps(
  [
    { reducer: 'user', property: 'id' },
    { reducer: 'posts', property: 'list' }
  ],
  {
    load: async (state) => {
      const res = await fetch(`/api/posts?user=${state.user.id}`);
      return res.json();
    }
  }
);
```

---

### Utilitários de Suspense

#### `invalidateAtomicProp(reducer, property, key?)`

Invalida o cache para uma propriedade específica.

```tsx
import { invalidateAtomicProp } from '@quojs/react';

// Após uma mutação
await emit('user', 'update', newData);
invalidateAtomicProp('user', 'profile');
```

---

#### `invalidateAtomicPropsByReducer(reducer)`

Invalida todas as entradas de cache para um reducer.

```tsx
import { invalidateAtomicPropsByReducer } from '@quojs/react';

invalidateAtomicPropsByReducer('todos');
```

---

#### `clearSuspenseCache()`

Limpa todo o cache de Suspense.

```tsx
import { clearSuspenseCache } from '@quojs/react';

clearSuspenseCache();
```

---

## Comparação de Desempenho

### Redux / Zustand (Granularidade grossa)

```tsx
// ❌ Re-renderiza quando QUALQUER tarefa muda
const todos = useSelector(state => state.todos.items);

return <div>{todos.map(todo => ...)}</div>;
```

**Problema:** Toda a árvore de componentes re-renderiza em cada mudança de tarefa.

### Quo.js (Granularidade fina)

```tsx
// ✅ Somente re-renderiza quando ESTA tarefa específica muda
function TodoItem({ id }) {
  const title = useAtomicProp({ 
    reducer: 'todos', 
    property: `items.${id}.title` 
  });
  
  return <div>{title}</div>;
}
```

**Resultado:** Zero renderizações desperdiçadas.

[Ver comparação de flamegraph →](https://github.com/quojs/quojs/blob/main/examples/v0/quojs-in-react/redux-quojs-profiler.pt.md)

---

## Suporte para TypeScript

Os hooks React do Quo.js são totalmente tipados:

```typescript
type AppEM = {
  todos: {
    add: { id: string; title: string };
    toggle: { id: string };
  };
};

const emit = useEmit<AppEM>();

// ✅ O autocompletar funciona
await emit('todos', 'add', { 
  id: '1',
  title: 'Comprar leite'
});

// ❌ TypeScript detecta erros
await emit('todos', 'add', { id: 1 }); // Erro: id deve ser string
await emit('invalid', 'event', null);  // Erro: Canal desconhecido
```

---

## Recursos do React 18+

### Concurrent Mode

Quo.js é totalmente compatível com a renderização concorrente do React 18:

```tsx
import { startTransition } from 'react';

function Search() {
  const emit = useEmit();
  
  const handleSearch = (query) => {
    startTransition(() => {
      emit('search', 'query', query);
    });
  };
  
  return <input onChange={(e) => handleSearch(e.target.value)} />;
}
```

### Suspense

```tsx
import { Suspense } from 'react';

function App() {
  return (
    <Suspense fallback={<Loading />}>
      <UserProfile />
    </Suspense>
  );
}

function UserProfile() {
  const user = useSuspenseAtomicProp(
    { reducer: 'user', property: 'profile' },
    {
      load: async () => {
        const res = await fetch('/api/user');
        return res.json();
      }
    }
  );
  
  return <div>Bem-vindo, {user.name}!</div>;
}
```

---

## Migrando da v0.4.x

### Mudanças de Nomes de Hooks (v0.5.0)

| Antigo (v0.4.x) | Novo (v0.5.0) | Status |
|-----------------|---------------|--------|
| `useDispatch()` | `useEmit()` | ⚠️ Depreciado (ainda funciona com aviso) |
| `useSliceProp()` | ❌ Removido | Use `useAtomicProp()` |
| `useSliceProps()` | ❌ Removido | Use `useAtomicProps()` |

### Exemplo de Migração

```tsx
// ANTES (v0.4.x)
import { useDispatch, useSliceProp } from '@quojs/react';

function Counter() {
  const value = useSliceProp({ reducer: 'counter', property: 'value' });
  const dispatch = useDispatch();
  
  return (
    <button onClick={() => dispatch('counter', 'increment', 1)}>
      {value}
    </button>
  );
}

// DEPOIS (v0.5.0)
import { useEmit, useAtomicProp } from '@quojs/react';

function Counter() {
  const value = useAtomicProp({ reducer: 'counter', property: 'value' });
  const emit = useEmit();
  
  return (
    <button onClick={() => emit('counter', 'increment', 1)}>
      {value}
    </button>
  );
}
```

---

## Exemplos

- **[Aplicativo de Tarefas](../../examples/v0/quojs-in-react/README.pt.md)** — CRUD completo com perfilamento de desempenho
- **[Logo Cinético](../../examples/v0/quojs-kinetic-logo/README.pt.md)** — 900 círculos SVG + simulação de física
- **[Next.js 15](../../examples/v0/quojs-in-nextjs/README.pt.md)** — SSR + alternador de tema

---

## Documentação

- **[Guia de Início Rápido](https://quojs.dev)** — Comece em 5 minutos
- **[Referência da API TypeDoc](./docs/README.md)** — Documentação completa da API
- **[Comparação de Bibliotecas](../../docs/pt/design/state-management-library-comparison.md)** — vs Redux, Zustand, Jotai, etc.

---

## Contribuindo

Veja:
- [Raiz do Monorepo](../../)
- [Guia de Contribuição](../../docs/pt/CONTRIBUTING.md)
- [Código de Conduta](../../docs/pt/CODE_OF_CONDUCT.md)

---

## Status

**Release Candidate** — As APIs são estáveis, usadas em produção, mudanças menores possíveis antes da v1.0.

---

## Licença

**MIT** — Livre para usar em projetos comerciais e de código aberto.

---

Feito no 🇲🇽 para o mundo.