![Quo.js logo](https://quojs.dev/assets/logo.svg)

# Quo.js

> [ 🇲🇽 Versión en Español](https://github.com/quojs/quojs/blob/main/docs/es/README.md)&nbsp;
> |&nbsp; 👉 [ 🇵🇹 Versão Portuguesa](https://github.com/quojs/quojs/blob/main/docs/pt/README.md)&nbsp;
> |&nbsp;[ 🇺🇸 English Version](https://github.com/quojs/quojs/blob/main/README.md)&nbsp;
> |&nbsp;[ 🇫🇷 Version française](https://github.com/quojs/quojs/blob/main/docs/fr/README.md)

![Bundle size](https://img.shields.io/bundlephobia/min/@quojs/core)
![Bundle size](https://img.shields.io/bundlephobia/minzip/@quojs/core)
![npm unpacked size](https://img.shields.io/npm/unpacked-size/@quojs/core)
![npm downloads](https://badgen.net/npm/dm/@quojs/core)
![License](https://img.shields.io/npm/l/@quojs/core)

**Reatividade de granularidade fina para aplicações orientadas a eventos.**

![Kinetic Logo Demo](https://quojs.dev/assets/examples/quojs-dots.gif)

> 1000+ círculos SVG, cada um assinando sua própria posição via `useAtomicProp`. Cada círculo re-renderiza independentemente — o restante da árvore permanece intocado. [Veja o código-fonte da demo.](https://github.com/quojs/quojs/blob/main/examples/v0/quojs-kinetic-logo/README.md)

---

## A proposta em 30 segundos

```tsx
import { useAtomicProp, useEmit } from './hooks';

function TodoTitle({ index }: { index: number }) {
  // Subscribes to items[index].title — re-renders ONLY when it changes.
  const title = useAtomicProp({
    reducer: 'todos',
    property: `items.${index}.title`,
  });
  const emit = useEmit();

  return (
    <span onClick={() => emit('todos', 'edit', { index, title: 'New title' })}>
      {title}
    </span>
  );
}
```

Sem seletores. Sem memoização. Sem otimização manual. A assinatura *é* a otimização.

---

## Por que Quo.js?

### 1. Assinaturas de caminho de granularidade fina com wildcards

Assine `"items.0.title"` ou `"items.*.done"` e re-renderize somente quando esse caminho exato muda. Funciona sobre uma árvore de estado completa — incluindo objetos aninhados, arrays e chaves dinâmicas.

```tsx
// Exact path — re-renders when items[0].title changes
const title = useAtomicProp({ reducer: 'todos', property: 'items.0.title' });

// Wildcard — re-renders when ANY item's 'done' flag changes
const allDone = useAtomicProp(
  { reducer: 'todos', property: 'items.*.done' },
  (state) => state.items.every(i => i.done),
);
```

[Veja a comparação de flamegraph (Redux vs Quo.js).](https://github.com/quojs/quojs/blob/main/examples/v0/quojs-in-react/redux-quojs-profiler.md)

### 2. Pipeline de eventos estruturado

Os eventos fluem através de um pipeline formal onde cada estágio é extensível:

```
emit() → dedup → middleware (can reject) → reducers → event subscribers → effects → coarse subscribers
```

A rejeição pelo middleware cria **eventos não confirmados** aos quais a UI pode reagir — útil para autorização, validação e padrões de UI otimista:

```tsx
// Show a warning when middleware blocks a delete
useEvent('ui', 'delete', (event) => {
  showToast('Delete was blocked by permissions');
}, 'uncommitted');
```

### 3. Organização de eventos baseada em canais

Os eventos são tuplas `(channel, type, payload)` — namespacing natural que escala sem colisões:

```typescript
await emit('auth', 'login', credentials);
await emit('analytics', 'track', event);
await emit('ui', 'toast', { message: 'Saved!' });
```
---

## Pacotes

| Pacote | Descrição |
|--------|-----------|
| **[@quojs/core](https://github.com/quojs/quojs/blob/main/packages/core/README.md)** | Store agnóstico de framework, reducers, middleware, effects |
| **[@quojs/react](https://github.com/quojs/quojs/blob/main/packages/react/README.md)** | Hooks React com assinaturas de granularidade fina e suporte a Suspense |

---

## Configuração Rápida (React)

### 1. Instalar

```bash
npm install @quojs/core @quojs/react
```

### 2. Defina seu mapa de eventos

```typescript
// types.ts
export type AppEM = {
  todos: {
    add: { id: string; title: string };
    toggle: { id: string };
    delete: { id: string };
  };
};
```

### 3. Crie o store

```typescript
// store.ts
import { createStore, eventKeys } from '@quojs/core';
import type { AppEM } from './types';

export type AppState = {
  todos: { items: Array<{ id: string; title: string; done: boolean }> };
};

export const store = createStore<AppState, AppEM>({
  name: 'App',
  reducer: {
    todos: {
      state: { items: [] },
      when: { keys: eventKeys<AppEM>()([
        ['todos', 'add'],
        ['todos', 'toggle'],
        ['todos', 'delete'],
      ])},
      reducer: (state, event) => {
        switch (event.type) {
          case 'add':
            return { items: [...state.items, { ...event.payload, done: false }] };
          case 'toggle':
            return {
              items: state.items.map(i =>
                i.id === event.payload.id ? { ...i, done: !i.done } : i
              ),
            };
          case 'delete':
            return { items: state.items.filter(i => i.id !== event.payload.id) };
          default:
            return state;
        }
      },
    },
  },
});
```

### 4. Crie hooks tipados com `createQuoHooks`

```typescript
// hooks.ts
import { createContext } from 'react';
import { createQuoHooks } from '@quojs/react';
import type { StoreInstance } from '@quojs/core';
import type { AppState, AppEM } from './types';

export const AppStoreContext = createContext<
  StoreInstance<'todos', AppState, AppEM> | null
>(null);

export const {
  useAtomicProp,
  useAtomicProps,
  useEmit,
  useEvent,
  useSelector,
  shallowEqual,
} = createQuoHooks(AppStoreContext);
```

### 5. Forneça e use

```tsx
// App.tsx
import { StoreProvider } from '@quojs/react';
import { store } from './store';
import { AppStoreContext } from './hooks';

export function App() {
  return (
    <AppStoreContext.Provider value={store}>
      <TodoList />
    </AppStoreContext.Provider>
  );
}
```

---

## Exemplos ao Vivo

| Exemplo | Descrição |
|---------|-----------|
| **[Logo Cinético (1000+ partículas)](https://github.com/quojs/quojs/blob/main/examples/v0/quojs-kinetic-logo/README.md)** | Simulação de física com assinaturas de caminho independentes por círculo |
| **[App de Tarefas com Profiler](https://github.com/quojs/quojs/blob/main/examples/v0/quojs-in-react/README.md)** | Comparação de flamegraph lado a lado com Redux ([resultados do profiler](https://github.com/quojs/quojs/blob/main/examples/v0/quojs-in-react/redux-quojs-profiler.md)) |
| **[Next.js 15 App Router](https://github.com/quojs/quojs/blob/main/examples/v0/quojs-in-nextjs/README.md)** | Compatibilidade com SSR + App Router com alternância de tema |

---

## Documentação

- **[Guia de Início Rápido](https://github.com/quojs/quojs/blob/main/docs/en/QUICK_START_GUIDE.md)** — Cinco passos para um app funcional
- **[API do @quojs/core](https://github.com/quojs/quojs/blob/main/packages/core/README.md)** — Store, middleware, effects, matchers `When`
- **[API do @quojs/react](https://github.com/quojs/quojs/blob/main/packages/react/README.md)** — Hooks, Suspense, `createQuoHooks`
- **[Arquitetura de Fila de Eventos](https://github.com/quojs/quojs/blob/main/docs/en/design/event-queue-architecture.md)** — Análise técnica aprofundada do pipeline
- **[Comparação de Bibliotecas](https://github.com/quojs/quojs/blob/main/docs/en/design/state-management-library-comparison.md)** — Comparação arquitetural com Redux, Zustand, Jotai e outros

---

## Contribuindo

Damos boas-vindas a contribuições! Por favor leia:

- [Guia de Contribuição](https://github.com/quojs/quojs/blob/main/CONTRIBUTING.md)
- [Código de Conduta](https://github.com/quojs/quojs/blob/main/CODE_OF_CONDUCT.md)
- [Governança](https://github.com/quojs/quojs/blob/main/GOVERNANCE.md)
- [Mantenedores](https://github.com/quojs/quojs/blob/main/MAINTAINERS.md)
- [Política de Segurança](https://github.com/quojs/quojs/blob/main/SECURITY.md)

---

## Desenvolvimento (Monorepo)

```bash
npm i -g @microsoft/rush
rush install
rush build
rush test
```

Consulte o **[Guia do Desenvolvedor](https://github.com/quojs/quojs/blob/main/docs/en/DEVELOPER_GUIDE.md)** para mais detalhes.

---

## Status

O Quo.js está em estágio de **Release Candidate** (v0.7.0+):
- As APIs são estáveis e utilizadas em aplicações em produção
- Os tipos TypeScript são estritos e abrangentes
- APIs menores ainda podem evoluir antes da v1.0

Feedback e PRs são bem-vindos.

---

## Licença

**MIT** — Livre para uso em projetos comerciais e de código aberto.

Consulte [LICENSE](https://github.com/quojs/quojs/blob/main/LICENSE) para detalhes.

---

## Comunidade
- **Website:** [quojs.dev](https://quojs.dev)
- **Twitter/X:** [@quojs_dev](https://twitter.com/quojs_dev)
- **GitHub Discussions:** [Junte-se à conversa](https://github.com/quojs/quojs/discussions)
- **Issues:** [Reporte bugs ou solicite recursos](https://github.com/quojs/quojs/issues)
