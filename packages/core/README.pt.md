![Logotipo Quo.js](../../assets/logo.svg)

# Quo.js O estado das coisas, reescrito.

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

**Contêiner de estado orientado a eventos, agnóstico de framework.**

`@quojs/core` é a base do Quo.js—uma biblioteca moderna de gerenciamento de estado que combina
**eventos baseados em canais**, **assinaturas atômicas** e **suporte nativo para async** em um
pacote leve e universal.

**Funciona em todos os lugares:** Navegadores, Node.js 18+, Deno, Bun. Zero dependências do DOM.

---

## O que é @quojs/core?

`@quojs/core` fornece:

- **Arquitetura orientada a eventos** — Os eventos fluem através de canais
  `(channel, type, payload)`
- **Fila de eventos FIFO** — Processamento de eventos previsível e serializado com garantias de
  ordenação
- **Async-first** — Middleware e effects async nativos (sem thunks/sagas)
- **Assinaturas de granularidade fina** — Inscreva-se em caminhos de estado exatos via notação
  de pontos
- **Imutabilidade** — Aplicação de deep-freeze com detecção de mudanças estruturais
- **TypeScript-first** — Excelente inferência de tipos e autocompletar

> Confira o relatório de
> [Comparação de Bibliotecas de Gerenciamento de Estado](https://github.com/quojs/quojs/blob/main/docs/pt/design/state-management-library-comparison.md).

---

## Instalação

```bash
npm install @quojs/core
# ou
yarn add @quojs/core
# ou
pnpm add @quojs/core
```

---

## Guia de início rápido

---

## Conceitos Fundamentais

### Arquitetura Orientada a Eventos

Os eventos são cidadãos de primeira classe no Quo.js. Cada mudança de estado é acionada por um
evento explícito.

```typescript
// Os eventos têm um canal, tipo e payload
await store.emit("auth", "login", { username, password });
await store.emit("analytics", "track", { event: "page_view" });
await store.emit("ui", "toast", { message: "Bem-vindo!" });
```

**Benefícios:**

- Intenção clara (cada ação é rastreável)
- Modularidade natural (organize por canal)
- Trilha de auditoria (eventos são serializáveis)

Confira o documento de visão geral da
**[Arquitetura de Fila de Eventos](https://github.com/quojs/quojs/blob/main/docs/pt/design/event-queue-architecture.md)**.

### Async-First

Middleware e effects são `async` por padrão. Nenhuma biblioteca externa necessária.

```typescript
// Middleware assíncrono
const authMiddleware = async (state, event, emit) => {
  if (event.type === "login") {
    const token = await authenticateUser(event.payload);
    await emit("auth", "loginSuccess", { token });
    return false; // Cancela o evento original
  }
  return true;
};

// Effects assíncronos (executam após os reducers)
const analyticsEffect = async (event, getState, emit) => {
  if (event.channel === "analytics") {
    await sendToAnalytics(event.payload);
  }
};

const store = createStore({
  name: "App",
  reducer: {
    /* ... */
  },
  middleware: [authMiddleware],
  effects: [
    {
      events: [["analytics", "track"]],
      effect: analyticsEffect,
    },
  ],
});
```

### Assinaturas de Granularidade Fina

Inscreva-se em caminhos de estado exatos usando notação de pontos:

```typescript
// Inscrever-se em caminho aninhado
store.connect({ reducer: "todos", property: "items.0.title" }, (change) => {
  console.log("Título da primeira tarefa mudou:", change.newValue);
});

// Padrões wildcard
store.connect({ reducer: "todos", property: "items.*.completed" }, (change) => {
  console.log("Status de conclusão de uma tarefa mudou");
});
```

### Garantias de Imutabilidade

O estado está **deep-frozen** antes de ser confirmado para prevenir mutações acidentais:

```typescript
const state = store.getState();
state.counter.value = 999; // ❌ TypeError: Não é possível atribuir a propriedade somente leitura

// Em vez disso, emita eventos:
await store.emit("counter", "set", 999); // ✅ Forma correta
```

---

## Melhores Práticas

### Código de Aplicação

#### 1. Sempre Aguarde `emit()`

```typescript
// ❌ RUIM: Disparar e esquecer
emit("todo", "add", todo);
const state = store.getState(); // Pode não ter a nova tarefa ainda!

// ✅ BOM: Aguardar a conclusão
await emit("todo", "add", todo);
const state = store.getState(); // Garantido que tem a nova tarefa
```

#### 2. Evite Loops Infinitos

```typescript
// ❌ RUIM: Recursão infinita
registerEffect({
  events: [["counter", "increment"]],
  effect: (evt, getState, emit) => {
    emit("counter", "increment", evt.payload + 1); // Infinito!
  },
});

// ✅ BOM: Condição de guarda
registerEffect({
  events: [["counter", "increment"]],
  effect: (evt, getState, emit) => {
    if (evt.payload < 100) {
      // Parar em 100
      emit("counter", "increment", evt.payload + 1);
    }
  },
});
```

#### 3. Mantenha os Reducers Rápidos

```typescript
// ❌ RUIM: Reducer lento bloqueia a fila
reducer: (state, event) => {
  const result = expensiveComputation(); // Bloqueia por segundos
  return { ...state, result };
};

// ✅ BOM: Mover para effect assíncrono
reducer: (state, event) => {
  return { ...state, loading: true };
};

registerEffect({
  events: [["data", "compute"]],
  effect: async (evt, getState, emit) => {
    const result = await computeAsync(); // Não bloqueia
    emit("data", "computeComplete", result);
  },
});
```

#### 4. Trate Erros de Effects

```typescript
// ❌ RUIM: Erros de effect não tratados
effect: async (evt, getState, emit) => {
  const data = await fetch(url); // Pode lançar erro
  emit("data", "loaded", data);
};

// ✅ BOM: Tratamento de erros com eventos de falha
effect: async (evt, getState, emit) => {
  try {
    const data = await fetch(url);
    emit("data", "loadSuccess", data);
  } catch (error) {
    emit("data", "loadFailure", { error: error.message });
  }
};
```

#### 5. Limite Eventos de Alta Frequência

```typescript
// ❌ RUIM: Inunda a fila
window.addEventListener("mousemove", (e) => {
  emit("ui", "mouseMove", { x: e.clientX, y: e.clientY });
});

// ✅ BOM: Limitar emissões
import { throttle } from "lodash-es";

const throttledEmit = throttle(
  (x, y) => emit("ui", "mouseMove", { x, y }),
  16, // ~60fps
);

window.addEventListener("mousemove", (e) => {
  throttledEmit(e.clientX, e.clientY);
});
```

---

## Recursos Avançados

### Reducers Dinâmicos

Adicione ou remova reducers em tempo de execução:

```typescript
// Adicionar um novo reducer dinamicamente
const disposeReducer = store.registerReducer("newFeature", {
  state: { enabled: false },
  events: [["features", "toggle"]],
  reducer: (state, event) => {
    return { enabled: !state.enabled };
  },
});

// Mais tarde: remover o reducer
disposeReducer();
```

### Deduplicação de Eventos

Quo.js previne automaticamente o processamento duplicado de eventos (seguro para React Strict
Mode):

```typescript
// No React Strict Mode, effects disparam duas vezes em desenvolvimento
useEffect(() => {
  emit("analytics", "pageView", { page });
  // ↑ Disparado 2x pelo React, mas Quo.js processa apenas uma vez
}, [page]);
```

### Middleware

O middleware executa **antes** dos reducers e pode cancelar eventos:

```typescript
const loggingMiddleware = async (state, event, emit) => {
  console.log("Evento:", event.channel, event.type, event.payload);
  return true; // Permitir que o evento continue
};

const validationMiddleware = async (state, event) => {
  if (event.type === "addTodo" && !event.payload.title) {
    console.error("Tarefa inválida: falta o título");
    return false; // Cancelar evento
  }
  return true;
};
```

### Effects

Effects executam **após** os reducers e são ótimos para efeitos colaterais:

```typescript
const saveToLocalStorageEffect = async (event, getState) => {
  const state = getState();
  localStorage.setItem("app-state", JSON.stringify(state));
};

store.registerEffect({
  events: [
    ["todos", "add"],
    ["todos", "toggle"],
    ["todos", "delete"],
  ],
  effect: saveToLocalStorageEffect,
});
```

---

## Suporte para TypeScript

Quo.js é TypeScript-first com excelente inferência de tipos:

```typescript
// O mapa de eventos é totalmente tipado
type AppEM = {
  counter: {
    increment: number; // Tipo de payload
    decrement: number;
  };
};

const store = createStore<AppEM>({
  /* ... */
});

// ✅ O autocompletar funciona:
await store.emit("counter", "increment", 5);
// ↑ Sugere: 'increment' | 'decrement'
// ↑ Espera: number

// ❌ TypeScript detecta erros:
await store.emit("counter", "increment", "five"); // Erro: Esperado number
await store.emit("invalid", "event", null); // Erro: Canal desconhecido
```

---

## Runtime Universal

`@quojs/core` tem **zero dependências do DOM** e funciona onde quer que JavaScript execute:

### Navegador

```typescript
import { createStore } from "@quojs/core";
const store = createStore({
  /* ... */
});
```

### Node.js

```typescript
const { createStore } = require("@quojs/core");

const store = createStore({
  name: "ServerState",
  reducer: {
    /* ... */
  },
});

// Usar em middleware Express, jobs em background, etc.
app.use((req, res, next) => {
  req.store = store;
  next();
});
```

### Deno / Bun

```typescript
import { createStore } from "@quojs/core";
// Funciona identicamente a navegadores/Node.js
```

---

## Visão Geral da API

### Criação de Store

- `createStore(spec)` — Criar uma nova instância de store
- `store.emit(channel, type, payload)` — Emitir um evento (async)
- `store.getState()` — Obter estado atual (somente leitura)
- `store.subscribe(listener)` — Inscrever-se em qualquer mudança de estado
- `store.connect(spec, handler)` — Inscrever-se em caminho de estado específico

### Registro Dinâmico

- `store.registerReducer(name, spec)` — Adicionar reducer em tempo de execução
- `store.registerMiddleware(middleware)` — Adicionar middleware em tempo de execução
- `store.registerEffect(spec)` — Adicionar effect em tempo de execução

### Hot Module Replacement

- `store.replaceReducers(reducers, opts)` — Substituir todos os reducers (HMR)
- `store.replaceMiddleware(middleware)` — Substituir todos os middleware (HMR)
- `store.replaceEffects(effects)` — Substituir todos os effects (HMR)

---

## Desempenho

| Métrica               | Valor                                   |
| --------------------- | --------------------------------------- |
| **Tamanho do Bundle** | ~8KB (minificado + gzipped)             |
| **Tree-shakeable**    | ✅ Sim (módulos ES)                     |
| **Dependências**      | Zero dependências em tempo de execução  |
| **TypeScript**        | Definições de tipos completas incluídas |

---

## Documentação

- **[Guia de Início Rápido](https://quojs.dev)** — Comece em 5 minutos
- **[Referência da API TypeDoc](https://github.com/quojs/quojs/blob/main/packages/core/docs/README.md)** — Documentação completa da API (English)
- **[Arquitetura de Fila de Eventos](https://github.com/quojs/quojs/blob/main/docs/pt/design/event-queue-architecture.md)** — Análise técnica
  profunda
- **[Comparação de Bibliotecas](https://github.com/quojs/quojs/blob/main/docs/pt/design/library-comparison.md)** — vs Redux, Zustand, Jotai,
  etc.

---

## Exemplos

- **[Aplicativo de Tarefas](https://github.com/quojs/quojs/blob/main/examples/v0/quojs-in-react/README.pt.md)** — Exemplo CRUD completo com
  perfilamento de desempenho
- **[Logo Cinético](https://github.com/quojs/quojs/blob/main/examples/v0/quojs-kinetic-logo/README.pt.md)** — Simulação de física com 900
  partículas
- **[Integração com Next.js](https://github.com/quojs/quojs/blob/main/examples/v0/quojs-in-nextjs/README.pt.md)** — SSR + alternador de tema

---

## Migrando da v0.4.x

### Mudanças de Terminologia (v0.5.0+)

| Antigo (v0.4.x) | Novo (v0.5.0+) | Status                                       |
| --------------- | -------------- | -------------------------------------------- |
| `dispatch()`    | `emit()`       | ❌ Removido (use `emit()` no lugar)          |
| `Action`        | `Event`        | ❌ Removido (use o tipo `Event`)             |
| `ActionMap`     | `EventMap`     | ❌ Removido (use o tipo `EventMapBase`)      |
| `ActionPair`    | `EventKey`     | ❌ Removido (use o tipo `EventKey`)          |
| `ActionUnion`   | `EventUnion`   | ❌ Removido (use o tipo `EventUnion`)        |
| `Dispatch`      | `Emit`         | ❌ Removido (use o tipo `Emit`)              |
| `typedActions`  | `typedEvents`  | ❌ Removido (use a função `typedEvents`)     |
| `action.event`  | `event.type`   | ⚠️ Mudança disruptiva                        |

### Exemplo de Migração

```typescript
// ANTES (v0.4.x)
store.dispatch("counter", "increment", 1);
const actions = typedActions([])('counter', ['increment']);
type MyAction = Action<EM, 'counter', 'increment'>;

// DEPOIS (v0.5.0+)
store.emit("counter", "increment", 1);
const events = typedEvents([])('counter', ['increment']);
type MyEvent = Event<EM, 'counter', 'increment'>;
```

**Nota:** Todos os aliases depreciados foram removidos. Se você está atualizando da v0.4.x, deve atualizar seu código para usar a nova terminologia de event-bus.

---

## Contribuindo

Damos boas-vindas a contribuições! Veja:

- [Raiz do Monorepo](https://github.com/quojs/quojs/blob/main/docs/pt/README.md)
- [Guia de Contribuição](https://github.com/quojs/quojs/blob/main/docs/pt/CONTRIBUTING.md)
- [Código de Conduta](https://github.com/quojs/quojs/blob/main/docs/pt/CODE_OF_CONDUCT.md)

---

## Status

**Release Candidate** — As APIs são estáveis, usadas em produção, mudanças menores possíveis
antes da v1.0.

---

## Licença

**MIT** — Livre para usar em projetos comerciais e de código aberto.

---

Feito no 🇲🇽 para o mundo.
