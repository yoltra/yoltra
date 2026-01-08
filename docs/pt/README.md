![Quo.js logo](https://quojs.dev/assets/logo.svg)

# Quo.js

> [ 🇲🇽 Versión en Español](https://github.com/quojs/quojs/blob/main/docs/es/README.md)&nbsp;
> |&nbsp; 👉 [ 🇵🇹 Versão Portuguesa](https://github.com/quojs/quojs/blob/main/docs/pt/README.md)&nbsp;
> |&nbsp;[ 🇺🇸 English Version](https://github.com/quojs/quojs/blob/main/README.md)&nbsp;
> |&nbsp;[ 🇫🇷 Version française](https://github.com/quojs/quojs/blob/main/docs/fr/README.md)

![Tamanho do bundle](https://badgen.net/bundlephobia/min/@quojs/core)
![Tamanho do bundle](https://badgen.net/bundlephobia/minzip/@quojs/core)
![Tamanho do bundle](https://badgen.net/bundlephobia/tree-shaking/@quojs/core)
![Tamanho do bundle](https://badgen.net/bundlephobia/dependency-count/@quojs/core)
![Downloads npm](https://badgen.net/npm/dm/@quojs/core)
![Licença](https://img.shields.io/npm/l/@quojs/core)

**Gerenciamento de estado orientado a eventos com assinaturas atômicas.** 
Quo.js é um contêiner de estado moderno, async-first que combina **eventos baseados em canais**, **reatividade de granularidade fina** e **suporte nativo para async**—sem a complexidade do Redux Toolkit ou a mágica implícita do MobX.

Construído para **aplicações web**, **servidores Node.js**, **ferramentas CLI** e **microsserviços**.

---

## O que é Quo.js?

Quo.js é um **contêiner de estado orientado a eventos, async-first** projetado para resolver três problemas fundamentais:

### 1. **Desempenho: Zero Re-renderizações Desnecessárias**

As bibliotecas de estado tradicionais re-renderizam componentes quando *qualquer* parte do estado inscrito muda. Quo.js usa **assinaturas atômicas de caminho** para eliminar esse desperdício.

```tsx
// ❌ Redux/Zustand: Re-renderiza quando QUALQUER tarefa muda
const todos = useSelector(state => state.todos);

// ✅ Quo.js: Somente re-renderiza quando o título DESTA tarefa específica muda
const title = useAtomicProp({ 
  reducer: 'todos', 
  property: 'items.0.title' 
});
```

[Ver comparação de flamegraph →](https://github.com/quojs/quojs/blob/main/examples/v0/quojs-in-react/redux-quojs-profiler.pt.md)

### 2. **Complexidade Assíncrona: Integrada, Não Adicionada**

Quo.js trata o assíncrono como uma preocupação de primeira classe. Middleware e efeitos são `async` por padrão—sem thunks, sem sagas, sem cerimônias.

```typescript
// Middleware assíncrono integrado
const middleware = async (state, event, emit) => {
  if (event.type === 'fetchUser') {
    const user = await fetch('/api/user').then(r => r.json());
    await emit('user', 'loaded', user);
  }
  return true;
};
```

### 3. **Organização: Eventos Baseados em Canais**

Os eventos são organizados por namespace através de canais `(channel, type, payload)`, evitando colisões de nomes em aplicações grandes.

```typescript
emit('auth', 'login', credentials);     // Eventos de autenticação
emit('analytics', 'track', event);      // Eventos de analytics
emit('ui', 'toast', message);           // Eventos de UI
```

---

## Recursos Principais

- 🎯 **Assinaturas Atômicas** — Inscreva-se em caminhos de estado exatos; somente re-renderiza quando eles mudam
- ⚡ **Async-First** — Middleware + efeitos async nativos; sem thunks/sagas necessários
- 🗪 **Orientado a Eventos** — Eventos baseados em canais com garantias de ordenação FIFO
- 🛡️ **TypeScript-First** — Excelente inferência de tipos e autocompletar
- 🧩 **Reducers Dinâmicos** — Adicione/remova slices de estado em tempo de execução
- 🌍 **Agnóstico de Framework** — Por enquanto, apenas React, mas já estamos trabalhando para expandir nossa cobertura.
- 📌 **Leve** — ~15KB no total (@quojs/core + @quojs/react)

---

## Pacotes

- **[@quojs/core](https://github.com/quojs/quojs/blob/main/packages/core/README.pt.md)** — Store principal, reducers, middleware, effects (agnóstico de framework)
- **[@quojs/react](https://github.com/quojs/quojs/blob/main/packages/react/README.pt.md)** — Hooks React e provider (compatível com Suspense/Concurrent)

---

## Exemplo Rápido

```typescript
import { createStore } from '@quojs/core';

// Defina seu mapa de eventos
type AppEM = {
  counter: {
    increment: number;
    decrement: number;
    reset: null;
  };
};

// Crie o store
const store = createStore<AppEM>({
  name: 'CounterApp',
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

// Emita eventos
await store.emit('counter', 'increment', 1);
await store.emit('counter', 'decrement', 1);
await store.emit('counter', 'reset', null);

// Obtenha o estado
const state = store.getState();
console.log(state.counter.value); // 0
```

### Integração com React

```tsx
import { useAtomicProp, useEmit } from '@quojs/react';

function Counter() {
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

## Exemplos ao Vivo

| Exemplo | Descrição | Captura de tela |
|---------|-----------|-----------------|
| **[Aplicativo de Tarefas com Profiler](https://github.com/quojs/quojs/blob/main/examples/v0/quojs-in-react/README.pt.md)** | Aplicativo de tarefas comparando desempenho Redux vs Quo.js ([flamegraphs](https://github.com/quojs/quojs/blob/main/examples/v0/quojs-in-react/redux-quojs-profiler.pt.md)) | ![Profiler](https://quojs.dev/assets/examples/profiler-quojs-frame-15.png) |
| **[Logo Cinético (900 partículas)](https://github.com/quojs/quojs/blob/main/examples/v0/quojs-kinetic-logo/README.pt.md)** | ~1500 círculos SVG impulsionados por simulação de física + estado Quo.js | ![Logo](https://quojs.dev/assets/examples/quojs-dots.gif) |
| **[Alternador de Tema Next.js 15](https://github.com/quojs/quojs/blob/main/examples/v0/quojs-in-nextjs/README.pt.md)** | Alternador de tema no Next.js 15 App Router (React 19 + Quo.js) | ![Tema](https://quojs.dev/assets/examples/quojs-in-nextjs--theme-switcher.png) |

---

## Como Quo.js se Compara?

Quo.js ocupa um espaço único entre a estrutura do Redux e a simplicidade do Zustand:

| Biblioteca | Arquitetura | Suporte Async | Assinaturas | Tamanho do Bundle |
|------------|-------------|---------------|-------------|-------------------|
| **Redux Toolkit** | Centralizado | Thunks/RTK Query | Nível de slice | ~45KB |
| **Zustand** | Centralizado | Manual | Nível de seletor | ~1KB |
| **Jotai** | Distribuído (átomos) | Manual | Nível de átomo | ~3KB |
| **MobX** | Observable | `runInAction` | Nível de observable | ~16KB |
| **XState** | Máquinas de Estado | Integrado | Nível de estado | ~30KB |
| **Quo.js** | Orientado a eventos | **Integrado** | **Nível de caminho** | ~15KB |

**Diferenciadores-Chave:**
- ✅ Assinaturas de granularidade fina **por padrão** (sem otimização manual)
- ✅ Pipeline async nativo (middleware + effects)
- ✅ Garantias de ordenação de eventos (fila FIFO)

👉 **[Leia a comparação completa →](https://github.com/quojs/quojs/blob/main/docs/pt/design/state-management-library-comparison.md)**

---

## Quando Você Deveria Usar Quo.js?

### ✅ Ótimo Para

- Aplicações onde o **desempenho** (otimização de re-renderização) é crítico
- Projetos que precisam de **padrões async nativos** (sem thunks/sagas)
- **Bases de código grandes** onde a organização por canais previne colisões
- **Aplicações universais** (web + servidores/microsserviços Node.js)
- Equipes que querem **fluxo de eventos explícito** para depuração

### ⚠️ Considere Alternativas Se

- Você precisa de **tamanho de bundle mínimo** (<5KB) → Experimente Zustand
- Sua equipe está **fortemente comprometida com Redux** → Experimente Redux Toolkit
- Você prefere **estado baseado em átomos** → Experimente Jotai
- Você está modelando **fluxos de trabalho complexos** → Experimente XState

---

## Instalação e Configuração

### 1. Instalar Pacotes

```bash
npm install @quojs/core @quojs/react
# ou
yarn add @quojs/core @quojs/react
# ou
pnpm add @quojs/core @quojs/react
```

### 2. Defina Seu Mapa de Eventos

```typescript
// types.ts
export type AppEM = {
  todos: {
    add: { id: string; title: string };
    toggle: { id: string };
    delete: { id: string };
  };
  ui: {
    setTheme: 'light' | 'dark';
  };
};
```

### 3. Crie o Store

```typescript
// store.ts
import { createStore } from '@quojs/core';
import type { AppEM } from './types';

export const store = createStore({
  name: 'MyApp',
  reducer: {
    todos: {
      state: { items: [] },
      events: [
        ['todos', 'add'],
        ['todos', 'toggle'],
        ['todos', 'delete']
      ],
      reducer: (state, event) => {
        // Sua lógica de reducer
      }
    }
  }
});
```

### 4. Use no React

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

---

## Documentação

- **[Guia de Início Rápido](https://github.com/quojs/quojs/blob/main/docs/pt/QUICK_START_GUIDE.md)** — Comece em 5 minutos
- **[Referência da API (@quojs/core)](https://github.com/quojs/quojs/blob/main/packages/core/docs/README.md)** — TypeDoc para o pacote core
- **[Referência da API (@quojs/react)](https://github.com/quojs/quojs/blob/main/packages/react/docs/README.md)** — TypeDoc para hooks React
- **[Comparação de Bibliotecas](https://github.com/quojs/quojs/blob/main/docs/pt/design/library-comparison.md)** — Como Quo.js se compara ao Redux, Zustand, Jotai, etc.
- **[Arquitetura de Fila de Eventos](https://github.com/quojs/quojs/blob/main/docs/pt/design/event-queue-architecture.md)** — Análise técnica profunda

---

## Contribuindo

Damos boas-vindas a contribuições! Por favor leia:

- [Guia de Contribuição](https://github.com/quojs/quojs/blob/main/docs/pt/CONTRIBUTING.md)
- [Código de Conduta](https://github.com/quojs/quojs/blob/main/docs/pt/CODE_OF_CONDUCT.md)
- [Governança](https://github.com/quojs/quojs/blob/main/docs/pt/GOVERNANCE.md)
- [Mantenedores](https://github.com/quojs/quojs/blob/main/docs/pt/MAINTAINERS.md)
- [Política de Segurança](https://github.com/quojs/quojs/blob/main/docs/pt/SECURITY.md)

---

## Desenvolvimento (Monorepo)

```bash
# Instale Rush globalmente
npm i -g @microsoft/rush

# Instale dependências
rush install

# Construa todos os pacotes
rush build

# Execute testes
rush test

# Construa um pacote específico
rush build --to @quojs/core

# Construa a partir de um pacote específico
rush build --from @quojs/react
```

Consulte o **[Guia do Desenvolvedor](https://github.com/quojs/quojs/blob/main/docs/pt/DEVELOPER_GUIDE.md)** para mais detalhes.

---

## Status

Quo.js está em estágio de **Release Candidate**:
- ✅ As APIs são estáveis (terminologia v0.5.0 finalizada)
- ✅ Os tipos TypeScript são estritos e abrangentes
- ✅ Usado em aplicações em produção
- ⚠️ APIs menores ainda podem evoluir antes da v1.0

**Feedback e PRs são bem-vindos!**

---

## Licença

**MIT** — Livre para usar em projetos comerciais e de código aberto.

Consulte [LICENSE](https://github.com/quojs/quojs/blob/main/LICENSE) para detalhes.

---

## Comunidade

- Visite o **[site oficial do Quo.js](https://quojs.dev/?lang=pt)**
- **Twitter/X:** [@quojs_dev](https://twitter.com/quojs_dev)
- **GitHub Discussions:** [Junte-se à conversa](https://github.com/quojs/quojs/discussions)
- **Issues:** [Reporte bugs ou solicite recursos](https://github.com/quojs/quojs/issues)

Feito no 🇲🇽 para o mundo.