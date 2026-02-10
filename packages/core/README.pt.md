![Quo.js logo](../../assets/logo.svg)

# @quojs/core

> [ 🇲🇽 Versión en Español](https://github.com/quojs/quojs/blob/main/packages/core/README.es.md)&nbsp;
> | &nbsp; 👉 [ 🇵🇹 Versão Portuguesa](https://github.com/quojs/quojs/blob/main/packages/core/README.pt.md)&nbsp;
> | &nbsp;[ 🇺🇸 English Version](https://github.com/quojs/quojs/blob/main/packages/core/README.md)&nbsp;
> | &nbsp;[ 🇫🇷 Version française](https://github.com/quojs/quojs/blob/main/packages/core/README.fr.md)

![Tamanho do bundle](https://badgen.net/bundlephobia/min/@quojs/core)
![Tamanho do bundle](https://badgen.net/bundlephobia/minzip/@quojs/core)
![Tamanho do bundle](https://badgen.net/bundlephobia/tree-shaking/@quojs/core)
![Tamanho do bundle](https://badgen.net/bundlephobia/dependency-count/@quojs/core)
![Versão npm](https://badgen.net/npm/v/@quojs/core)
![Downloads npm](https://badgen.net/npm/dm/@quojs/core)
![Licença](https://badgen.net/npm/license/@quojs/core)

**Contêiner de estado orientado a eventos, agnóstico de framework, com assinaturas de caminho de granularidade fina.**

`@quojs/core` é a base do [Quo.js](https://github.com/quojs/quojs/blob/main/README.md). Fornece o store, o pipeline de eventos, middleware, effects e o sistema de assinaturas `connect()`. Zero dependências de framework.

---

## Instalação

```bash
npm install @quojs/core
```

---

## O Pipeline de Eventos

Cada chamada a `emit()` flui através de um pipeline determinístico:

```
emit(channel, type, payload)
  │
  ├─ 1. Dedup ─── Ignora se impressão digital idêntica dentro da janela de tempo
  │
  ├─ 2. Middleware ─── Hooks pré-reducer (podem rejeitar → evento "não confirmado")
  │
  ├─ 3. Reducers ─── Atualizações síncronas de estado, detecção de mudanças por caminho
  │
  ├─ 4. Assinantes de eventos ─── Notificações de eventos confirmados/não confirmados
  │
  ├─ 5. Effects ─── Efeitos colaterais assíncronos (pós-reducer, indexados para busca O(1))
  │
  └─ 6. Assinantes grossos ─── Listeners externos do store (useSyncExternalStore, etc.)
```

Cada estágio é extensível. O middleware pode cancelar eventos, criando eventos "não confirmados" aos quais a UI ainda pode reagir. Effects executam após os reducers e enxergam o estado final.

---

## Conceitos Fundamentais

### Eventos baseados em canais

Os eventos são tuplas `(channel, type, payload)`. Os canais fornecem namespacing natural que escala em bases de código grandes:

```typescript
await store.emit('auth', 'login', credentials);
await store.emit('analytics', 'track', { event: 'page_view' });
await store.emit('ui', 'toast', { message: 'Saved!' });
```

### Assinaturas de granularidade fina via `connect()`

Assine caminhos exatos de estado usando notação de pontos. Suporta `*` (um segmento) e `**` (zero ou mais segmentos) como wildcards:

```typescript
// Exact path — fires when items[0].title changes
store.connect(
  { reducer: 'todos', property: 'items.0.title' },
  (change) => console.log('title:', change.oldValue, '→', change.newValue),
);

// Single-segment wildcard — fires when ANY item's title changes
store.connect(
  { reducer: 'todos', property: 'items.*.title' },
  (change) => console.log('some title changed at', change.path),
);

// Deep wildcard — fires when anything under items changes
store.connect(
  { reducer: 'todos', property: 'items.**' },
  (change) => console.log('items tree changed at', change.path),
);
```

### Imutabilidade

O estado é deep-frozen antes de ser confirmado. Mutações lançam erro em modo estrito:

```typescript
const state = store.getState();
state.counter.value = 999; // TypeError: Cannot assign to read-only property
```

---

## Segmentação de Eventos com Matchers `When`

Reducers, effects e middleware usam um matcher `When` unificado para declarar a quais eventos respondem:

```typescript
import { createStore, eventKeys } from '@quojs/core';

type AppEM = {
  ui: { increment: number; decrement: number; reset: void };
  admin: { setCounter: number };
  system: { init: void; shutdown: void };
};

// Match specific event keys (recommended — preserves type correlation)
const counterReducer = {
  state: { value: 0 },
  when: { keys: eventKeys<AppEM>()([['ui', 'increment'], ['ui', 'decrement']]) },
  reducer: (state, event) => {
    if (event.type === 'increment') return { value: state.value + event.payload };
    if (event.type === 'decrement') return { value: state.value - event.payload };
    return state;
  },
};

// Match all events in a channel
const uiLogger = {
  when: { channel: 'ui' },
  effect: (event) => console.log('UI event:', event.type),
};

// Match events across multiple channels
const auditTrail = {
  when: { channels: ['ui', 'admin'] },
  effect: (event) => logToAuditTrail(event),
};

// Match ALL events
const globalLogger = {
  when: { any: true },
  middleware: (state, event) => {
    console.log(`[${event.channel}] ${event.type}`);
    return true;
  },
};
```

---

## Middleware

O middleware executa **antes** dos reducers e pode cancelar a propagação do evento. Suporta tanto funções brutas (legado) quanto objetos `MiddlewareSpec` com segmentação:

```typescript
import type { MiddlewareSpec } from '@quojs/core';

// Targeted middleware — only runs for admin channel events
const adminGuard: MiddlewareSpec<AppState, AppEM> = {
  when: { channel: 'admin' },
  middleware: (state, event) => {
    if (!state.auth.isAdmin) return false; // Reject → creates "uncommitted" event
    return true;
  },
  meta: { type: 'middleware', name: 'adminGuard' },
};

// Global middleware — runs for all events
const logger = async (state, event, emit) => {
  console.log('Event:', event.channel, event.type);
  return true;
};

const store = createStore({
  name: 'App',
  reducer: { /* ... */ },
  middleware: [adminGuard, logger],
});
```

### Middleware dinâmico

```typescript
const off = store.registerMiddleware(async (state, event) => {
  return event.type !== 'forbidden';
});
off(); // Remove later
```

---

## Effects

Os effects executam **após** os reducers e enxergam o estado final. São indexados por evento para busca O(1):

```typescript
// Via store spec
const store = createStore({
  name: 'App',
  reducer: { /* ... */ },
  effects: [{
    when: { keys: eventKeys<AppEM>()([['todos', 'add'], ['todos', 'delete']]) },
    effect: async (event, getState, emit) => {
      await saveToServer(getState());
    },
    meta: { type: 'effect', name: 'syncToServer' },
  }],
});

// Dynamic registration
const off = store.registerEffect({
  when: { channel: 'analytics' },
  effect: async (event) => sendToAnalytics(event),
});

// Convenience helper for single event
const off2 = store.onEffect('ui', 'save', async (payload, getState, emit) => {
  await saveToCloud(payload);
});
```

---

## Assinaturas de Eventos

Assine eventos (não estado) a partir da camada de visualização. Útil para notificações, animações e para reagir a eventos rejeitados:

```typescript
// Committed events (default) — events that passed middleware
const off = store.onEvent('ui', 'save', (event, getState, emit, phase) => {
  console.log('Save committed:', event.payload);
});

// Uncommitted events — events rejected by middleware
store.onEvent('ui', 'delete', (event, getState, emit, phase) => {
  console.log('Delete was rejected');
}, 'uncommitted');

// All events — both committed and uncommitted
store.onEvent('ui', 'action', (event, getState, emit, phase) => {
  console.log(`Action ${phase}:`, event.type);
}, 'all');
```

---

## Deduplicação de Eventos

O Quo.js deduplica automaticamente eventos idênticos dentro de uma janela de tempo configurável. Isso previne processamento duplo no React Strict Mode:

```typescript
const store = createStore({
  name: 'App',
  reducer: { /* ... */ },
  dedupWindowMs: 100, // default: 50ms dev, 100ms prod
});
```

---

## Reducers Dinâmicos

Adicione ou remova slices de reducer em tempo de execução:

```typescript
const dispose = store.registerReducer('filters', {
  state: { q: '' },
  when: { keys: eventKeys<AppEM>()([['ui', 'setQuery']]) },
  reducer: (state, event) =>
    event.type === 'setQuery' ? { q: event.payload } : state,
});

// Later: remove the slice and its state
dispose();
```

---

## Hot Module Replacement

```typescript
if (import.meta.hot) {
  import.meta.hot.accept('./reducers', (mod) => {
    store.replaceReducers(mod.reducers, { preserveState: true });
  });

  import.meta.hot.accept('./middleware', (mod) => {
    store.replaceMiddleware(mod.middleware);
  });

  import.meta.hot.accept('./effects', (mod) => {
    store.replaceEffects(mod.effects);
  });

  // Or replace everything at once
  store.hotReplace({
    reducer: newReducers,
    middleware: newMiddleware,
    effects: newEffects,
    preserveState: true,
  });
}
```

---

## Melhores Práticas

### Sempre aguarde `emit()`

```typescript
await emit('todo', 'add', todo);
const state = store.getState(); // Guaranteed to reflect the new todo
```

### Mantenha os reducers rápidos

Reducers são síncronos e bloqueiam a fila de eventos. Mova trabalho pesado para effects:

```typescript
// Reducer: just set a loading flag
reducer: (state, event) => ({ ...state, loading: true }),

// Effect: do the heavy lifting
store.onEffect('data', 'compute', async (payload, getState, emit) => {
  const result = await computeAsync();
  await emit('data', 'computeComplete', result);
});
```

### Trate erros de effects

```typescript
store.registerEffect({
  when: { channel: 'data' },
  effect: async (event, getState, emit) => {
    try {
      const data = await fetch(url);
      await emit('data', 'loadSuccess', data);
    } catch (error) {
      await emit('data', 'loadFailure', { error: error.message });
    }
  },
});
```

---

## Visão Geral da API

### Criação de Store

| API | Descrição |
|-----|-----------|
| `createStore(spec)` | Cria um store (tipos inferidos a partir dos reducers) |
| `createStore<S, EM>(spec)` | Cria um store com tipos explícitos de estado/eventos |
| `store.emit(channel, type, payload)` | Emite um evento (retorna uma promise) |
| `store.getState()` | Obtém o snapshot atual do estado (somente leitura) |
| `store.subscribe(listener)` | Assinatura grossa (qualquer mudança de estado) |
| `store.connect(spec, handler)` | Assinatura de caminho de granularidade fina com wildcards |
| `store.onEvent(channel, type, handler, phase?)` | Assinatura de eventos (committed/uncommitted/all) |
| `store.onEffect(channel, type, handler)` | Atalho para effect de evento único |
| `store.dispose()` | Limpa timers e recursos |

### Registro Dinâmico

| API | Descrição |
|-----|-----------|
| `store.registerReducer(name, spec)` | Adiciona um slice em tempo de execução |
| `store.registerMiddleware(fn)` | Adiciona middleware em tempo de execução |
| `store.registerEffect(spec)` | Adiciona um effect em tempo de execução |

### HMR

| API | Descrição |
|-----|-----------|
| `store.replaceReducers(reducers, opts)` | Substitui todos os reducers |
| `store.replaceMiddleware(middleware)` | Substitui todos os middleware |
| `store.replaceEffects(effects)` | Substitui todos os effects |
| `store.hotReplace(partial)` | Substitui qualquer subconjunto de uma vez |

### Helpers

| API | Descrição |
|-----|-----------|
| `eventKeys<EM>()([...])` | Arrays de chaves de evento type-safe sem `as const` |

---

## Desempenho

| Métrica | Valor |
|---------|-------|
| **Tamanho do Bundle** | ~8KB (minificado + gzipped) |
| **Tree-shakeable** | Sim (módulos ES) |
| **Dependências** | Zero |
| **TypeScript** | Definições de tipos completas incluídas |

---

## Documentação

- **[README Raiz do Quo.js](https://github.com/quojs/quojs/blob/main/README.md)** — Visão geral e configuração rápida
- **[@quojs/react](https://github.com/quojs/quojs/blob/main/packages/react/README.md)** — Hooks React e Suspense
- **[Guia de Início Rápido](https://github.com/quojs/quojs/blob/main/docs/en/QUICK_START_GUIDE.md)** — Cinco passos para um app funcional
- **[Arquitetura de Fila de Eventos](https://github.com/quojs/quojs/blob/main/docs/en/design/event-queue-architecture.md)** — Análise técnica aprofundada
- **[Comparação de Bibliotecas](https://github.com/quojs/quojs/blob/main/docs/en/design/state-management-library-comparison.md)** — Comparação arquitetural

---

## Exemplos

- **[App de Tarefas](https://github.com/quojs/quojs/blob/main/examples/v0/quojs-in-react)** — CRUD completo com profiling de desempenho
- **[Logo Cinético](https://github.com/quojs/quojs/blob/main/examples/v0/quojs-kinetic-logo)** — 1000+ círculos SVG com simulação de física
- **[Integração com Next.js](https://github.com/quojs/quojs/blob/main/examples/v0/quojs-in-nextjs)** — SSR + App Router + alternador de tema

---

## Contribuindo

- [Raiz do Monorepo](https://github.com/quojs/quojs/blob/main/README.md)
- [Guia de Contribuição](https://github.com/quojs/quojs/blob/main/CONTRIBUTING.md)

---

## Status

**Release Candidate (v0.7.0+)** — As APIs são estáveis, utilizadas em produção, mudanças menores possíveis antes da v1.0.

---

## Licença

**MIT** — Livre para uso em projetos comerciais e de código aberto.
