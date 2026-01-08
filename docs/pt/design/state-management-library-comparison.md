# Comparação de Bibliotecas de Gerenciamento de Estado

> [ 🇲🇽 Versión en Español](https://github.com/quojs/quojs/blob/main/docs/es/design/state-management-library-comparison.md)&nbsp; |
> &nbsp; 👉 [ 🇵🇹 Versão Portuguesa](https://github.com/quojs/quojs/blob/main/docs/pt/design/state-management-library-comparison.md)&nbsp; |
> &nbsp;[ 🇺🇸 English Version](https://github.com/quojs/quojs/blob/main/docs/en/design/state-management-library-comparison.md)&nbsp; |
> &nbsp;[ 🇫🇷 Version française](https://github.com/quojs/quojs/blob/main/docs/fr/design/state-management-library-comparison.md)

**Versão:** 0.5.0
**Última atualização:** Janeiro 2026

## Visão Geral

Este documento fornece uma comparação técnica honesta do Quo.js contra bibliotecas populares de gerenciamento de estado. Cada comparação explora diferenças arquiteturais, adequação de casos de uso, características de desempenho e experiência do desenvolvedor.

---

## O que é Quo.js?

**Quo.js é um contêiner de estado orientado a eventos, async-first com assinaturas atômicas.**

### Arquitetura Central

```typescript
// Orientado a eventos: Eventos fluem através de canais
emit('todo', 'addItem', { title: 'Comprar leite' });

// Async-first: Middleware e efeitos assíncronos embutidos
const middleware = async (state, event, emit) => {
 await trackAnalytics(event);
 return true;
};

// Assinaturas atômicas: Assinar caminhos de estado exatos
useAtomicProp({ reducer: 'todos', property: 'items.0.title' });
// ↑ Apenas re-renderiza quando items[0].title muda
```

### Características Chave

| Aspecto | Descrição |
|--------|-------------|
| **Padrão Arquitetural** | Arquitetura orientada a eventos com roteamento baseado em canais |
| **Modelo de Estado** | Store centralizado com slices com namespaces |
| **Modelo de Eventos** | Fila FIFO com eventos `(channel, type, payload)` |
| **Modelo de Assinatura** | Assinaturas atômicas de granularidade fina via caminhos com pontos |
| **Modelo Assíncrono** | Emit baseado em Promise + middleware async + efeitos |
| **Modelo de Execução** | Processamento de eventos serializado (um de cada vez, em ordem) |
| **Runtime** | Universal (navegador + Node.js + Deno + Bun) |

### Que Problemas o Quo.js Resolve?

1. **Desempenho**: Elimina re-renderizações desnecessárias via assinaturas atômicas de caminho
2. **Complexidade**: Suporte async nativo sem thunks/sagas/observables
3. **Organização**: Eventos baseados em canais previnem colisões de nomes de tipo de ação
4. **Previsibilidade**: Garantias estritas de ordenamento de eventos asseguram transições de estado determinísticas
5. **Flexibilidade**: Funciona em apps web, servidores Node, ferramentas CLI, microsserviços

---

## Redux Toolkit

### Modelo Conceitual

**Redux Toolkit (RTK)** é o conjunto de ferramentas oficial e opinativo do Redux que reduz código boilerplate enquanto mantém os princípios fundamentais do Redux: fluxo de dados unidirecional, atualizações imutáveis e reducers puros.

```typescript
// Abordagem Redux Toolkit
const todosSlice = createSlice({
 name: 'todos',
 initialState: { items: [] },
 reducers: {
  addTodo: (state, action) => {
   state.items.push(action.payload); // Mutação com Immer
  }
 }
});

// Async via thunks
const fetchTodos = createAsyncThunk('todos/fetch', async (url) => {
 const res = await fetch(url);
 return res.json();
});

// Uso
dispatch(addTodo({ id: 1, title: 'Comprar leite' }));
dispatch(fetchTodos('/api/todos'));
```

**Arquitetura:**
- Store único com reducers de slice
- Tipos de ação planos (`'todos/addTodo'`)
- Reducers síncronos (Immer para imutabilidade)
- Async via thunks ou RTK Query
- Assinaturas grosseiras (re-renderização em qualquer mudança de slice a menos que otimizado manualmente)

### Quando Redux Toolkit Se Destaca

✅ **Equipes grandes com padrões Redux estabelecidos** 
Redux é testado em batalha em escala. Se sua equipe já conhece Redux, RTK é o caminho de upgrade óbvio.

✅ **Busca de dados via RTK Query** 
RTK Query fornece cache automático, re-busca e atualizações otimistas—uma solução completa de busca de dados.

✅ **Ecossistema DevTools** 
Redux DevTools é maduro, amplamente adotado e tem extensas integrações de terceiros.

✅ **Maturidade do ecossistema** 
Milhares de middlewares, enhancers e ferramentas disponíveis. Soluções existem para cada caso extremo.

### Quando Quo.js Se Destaca

✅ **Otimização de desempenho de granularidade fina** 
As assinaturas atômicas do Quo.js eliminam re-renderizações por padrão. RTK requer otimização manual de `useSelector`.

**Exemplo:**
```typescript
// RTK: O componente inteiro re-renderiza quando QUALQUER todo muda
const todos = useSelector(state => state.todos.items);

// Quo.js: Apenas re-renderiza quando o título DESTE todo específico muda
const title = useAtomicProp({ 
 reducer: 'todos', 
 property: 'items.0.title' 
});
```

✅ **Padrões assíncronos embutidos** 
O middleware e efeitos do Quo.js são async por padrão. Sem thunks, sem configuração RTK Query.

**Exemplo:**
```typescript
// Quo.js: Middleware async embutido
const middleware = async (state, event, emit) => {
 if (event.type === 'fetchTodos') {
  const data = await fetch('/api/todos').then(r => r.json());
  await emit('todos', 'loadSuccess', data);
  return false; // Cancelar evento original
 }
 return true;
};

// RTK: Requer thunk/RTK Query
const fetchTodos = createAsyncThunk('todos/fetch', async () => {
 return fetch('/api/todos').then(r => r.json());
});
```

✅ **Organização baseada em canais** 
Eventos do Quo.js são namespacados por canal, prevenindo colisões de nomes em apps grandes.

**Exemplo:**
```typescript
// Quo.js: Namespaces claros
emit('user', 'update', data);
emit('analytics', 'track', event);
emit('api', 'request', config);

// RTK: Tipos de ação planos requerem nomenclatura cuidadosa
dispatch({ type: 'user/update' });
dispatch({ type: 'analytics/track' });
dispatch({ type: 'api/request' });
```

✅ **Runtime universal** 
Quo.js não tem dependências DOM. Use-o em servidores Node.js, ferramentas CLI ou microsserviços.

### Comparação de Desempenho

| Métrica | Redux Toolkit | Quo.js |
|--------|---------------|--------|
| **Granularidade de Assinatura** | Nível de slice (otimização manual) | Nível de caminho (automático) |
| **Frequência de Re-renderização** | Alta (sem otimização) | Mínima (atômico por padrão) |
| **Overhead Assíncrono** | Camada de thunk + criadores de ação | Pipeline async embutido |
| **Tamanho de Bundle** | ~45KB (RTK + React-Redux) | ~15KB (@quojs/core + @quojs/react) |
| **Pegada de Memória** | Maior (assinaturas à árvore de estado completa) | Menor (assinaturas específicas de caminho) |

### Caminho de Migração: RTK → Quo.js

```typescript
// ANTES (Redux Toolkit)
const todosSlice = createSlice({
 name: 'todos',
 initialState: { items: [], filter: 'all' },
 reducers: {
  addTodo: (state, action) => {
   state.items.push(action.payload);
  },
  toggleTodo: (state, action) => {
   const todo = state.items.find(t => t.id === action.payload);
   if (todo) todo.completed = !todo.completed;
  }
 }
});

// DEPOIS (Quo.js v0.5.0)
import { withImmer } from './withImmer';

const todosReducer = withImmer<TodoState, AppEM>((draft, event) => {
 switch (event.type) {
  case 'addTodo':
   draft.items.push(event.payload);
   return;
  case 'toggleTodo':
   const todo = draft.items.find(t => t.id === event.payload);
   if (todo) todo.completed = !todo.completed;
   return;
 }
});

const todosSpec: ReducerSpec<TodoState, AppEM> = {
 state: { items: [], filter: 'all' },
 events: [
  ['todos', 'addTodo'],
  ['todos', 'toggleTodo']
 ],
 reducer: todosReducer
};
```

### Veredito

**Escolha Redux Toolkit se:**
- Sua equipe já é proficiente em Redux
- Você precisa das capacidades de busca de dados do RTK Query
- Você depende fortemente do ecossistema Redux
- Você prefere soluções opinativas e completas

**Escolha Quo.js se:**
- Desempenho (otimização de re-renderização) é crítico
- Você quer suporte async nativo sem camadas
- Você está construindo apps universais (web + Node.js)
- Você prefere APIs explícitas e minimalistas

---

## Zustand

### Modelo Conceitual

**Zustand** é uma biblioteca de gerenciamento de estado minimalista construída sobre hooks do React. Ela evita o boilerplate do Redux por uma simples API `create` + `set`.

```typescript
// Abordagem Zustand
const useStore = create((set) => ({
 todos: [],
 addTodo: (todo) => set((state) => ({ 
  todos: [...state.todos, todo] 
 })),
 toggleTodo: (id) => set((state) => ({
  todos: state.todos.map(t => 
   t.id === id ? { ...t, completed: !t.completed } : t
  )
 }))
}));

// Uso
const todos = useStore(state => state.todos);
const addTodo = useStore(state => state.addTodo);
```

**Arquitetura:**
- Store único com atualizações diretas de estado
- Sem ações ou eventos (apenas funções)
- Síncrono por padrão
- Assinaturas via funções seletoras
- Superfície de API mínima (~1KB)

### Quando Zustand Se Destaca

✅ **Boilerplate mínimo** 
Zustand tem a menor cerimônia de qualquer biblioteca de estado. Defina estado + ações em um único lugar.

✅ **Tamanho de bundle pequeno** 
~1KB torna Zustand ideal para apps com restrições de tamanho.

✅ **Modelo mental simples** 
Sem eventos, sem reducers, sem middleware—apenas funções que chamam `set()`.

✅ **Adoção gradual** 
Fácil de adicionar a projetos existentes sem refatoração maior.

### Quando Quo.js Se Destaca

✅ **Complexidade assíncrona** 
Quo.js lida com workflows async nativamente. Zustand requer orquestração manual.

**Exemplo:**
```typescript
// Zustand: Tratamento async manual
const useStore = create((set) => ({
 todos: [],
 loading: false,
 fetchTodos: async () => {
  set({ loading: true });
  try {
   const res = await fetch('/api/todos');
   const todos = await res.json();
   set({ todos, loading: false });
  } catch (error) {
   set({ loading: false, error });
  }
 }
}));

// Quo.js: Pipeline async embutido
const middleware = async (state, event, emit) => {
 if (event.type === 'fetchTodos') {
  await emit('todos', 'loading', true);
  try {
   const res = await fetch('/api/todos');
   const todos = await res.json();
   await emit('todos', 'loadSuccess', todos);
  } catch (error) {
   await emit('todos', 'loadFailure', error);
  }
  return false;
 }
 return true;
};
```

✅ **Garantias de ordenamento de eventos** 
A fila FIFO do Quo.js garante transições de estado determinísticas. Chamadas `set()` do Zustand podem intercalar de forma imprevisível.

✅ **Assinaturas de granularidade fina** 
Zustand requer otimização manual de seletores. Assinaturas atômicas do Quo.js são embutidas.

**Exemplo:**
```typescript
// Zustand: Re-renderiza quando QUALQUER todo muda (sem otimização)
const todos = useStore(state => state.todos);

// Zustand otimizado: Seletor manual
const firstTodo = useStore(
 state => state.todos[0],
 (a, b) => a?.id === b?.id // Igualdade personalizada
);

// Quo.js: Assinatura de granularidade fina automática
const firstTodo = useAtomicProp({ 
 reducer: 'todos', 
 property: 'items.0' 
});
```

✅ **Histórico de eventos estruturado** 
Eventos do Quo.js são de primeira classe, tornando depuração de viagem no tempo e analytics mais fáceis.

### Comparação de Desempenho

| Métrica | Zustand | Quo.js |
|--------|---------|--------|
| **Granularidade de Assinatura** | Nível de seletor (manual) | Nível de caminho (automático) |
| **Frequência de Re-renderização** | Média (com otimização) | Mínima (atômico por padrão) |
| **Tamanho de Bundle** | ~1KB | ~15KB |
| **Complexidade de Configuração** | Mínima | Moderada |
| **Padrões Async** | Manual | Embutidos |

### Caminho de Migração: Zustand → Quo.js

```typescript
// ANTES (Zustand)
const useStore = create((set) => ({
 count: 0,
 increment: () => set((state) => ({ count: state.count + 1 })),
 decrement: () => set((state) => ({ count: state.count - 1 }))
}));

// DEPOIS (Quo.js v0.5.0)
const counterReducer = (state: CounterState, event: EventUnion<AppEM>) => {
 switch (event.type) {
  case 'increment':
   return { count: state.count + 1 };
  case 'decrement':
   return { count: state.count - 1 };
  default:
   return state;
 }
};

const store = createStore({
 name: 'App',
 reducer: {
  counter: {
   state: { count: 0 },
   events: [['counter', 'increment'], ['counter', 'decrement']],
   reducer: counterReducer
  }
 }
});

// Uso
const emit = useEmit();
emit('counter', 'increment', null);
```

### Veredito

**Escolha Zustand se:**
- Tamanho de bundle é crítico (<5KB total)
- Você quer a API mais simples possível
- Seu app tem complexidade async mínima
- Você está construindo um app pequeno a médio

**Escolha Quo.js se:**
- Você precisa de padrões async robustos
- Otimização de desempenho é crítica
- Você quer garantias de ordenamento de eventos
- Você está construindo um app grande e complexo

---

## Jotai

### Modelo Conceitual

**Jotai** adota uma abordagem baseada em átomos inspirada no Recoil. Estado é distribuído entre átomos em vez de centralizado.

```typescript
// Abordagem Jotai
const countAtom = atom(0);
const todosAtom = atom([]);

// Átomos derivados
const completedCountAtom = atom(
 (get) => get(todosAtom).filter(t => t.completed).length
);

// Uso
const [count, setCount] = useAtom(countAtom);
const todos = useAtomValue(todosAtom);
```

**Arquitetura:**
- Estado distribuído (átomos)
- Composição de baixo para cima
- Atualizações atômicas (granularidade fina por design)
- Suspense-first
- Sem store central

### Quando Jotai Se Destaca

✅ **Reatividade de granularidade fina** 
Átomos são inerentemente granulares. Re-renderizações são mínimas por design.

✅ **Integração Suspense** 
Jotai foi construído para Suspense desde o primeiro dia.

✅ **Estado componível** 
Átomos podem depender de outros átomos, criando grafos de estado derivado.

✅ **Sem store global** 
Ótimo para estado em nível de componente ou com escopo de funcionalidade.

### Quando Quo.js Se Destaca

✅ **Modelo de estado centralizado** 
Quo.js mantém uma única fonte de verdade. Mais fácil de raciocinar para apps grandes.

✅ **Arquitetura orientada a eventos** 
Eventos do Quo.js criam uma trilha de auditoria. Atualizações de átomos do Jotai são implícitas.

**Exemplo:**
```typescript
// Jotai: Atualizações implícitas
setCount(count + 1); // De onde isso veio? Quem acionou?

// Quo.js: Eventos explícitos
emit('counter', 'increment', 1); // Intenção clara, rastreável
```

✅ **Middleware e efeitos** 
Quo.js tem um pipeline async central. Jotai requer gerenciamento de efeitos por átomo.

✅ **Coordenação de estado global** 
Quo.js se destaca quando atualizações de estado devem coordenar entre múltiplos slices (ex., auth afetando estado de UI).

### Comparação de Desempenho

| Métrica | Jotai | Quo.js |
|--------|-------|--------|
| **Granularidade de Assinatura** | Nível de átomo (fino por design) | Nível de caminho (fino por design) |
| **Frequência de Re-renderização** | Mínima | Mínima |
| **Tamanho de Bundle** | ~3KB | ~15KB |
| **Complexidade de Configuração** | Baixa | Moderada |
| **Modelo Mental** | De baixo para cima (átomos) | De cima para baixo (eventos) |

### Veredito

**Escolha Jotai se:**
- Você prefere estado distribuído baseado em átomos
- Você está construindo um app Suspense-first
- Você quer boilerplate mínimo
- Estado é principalmente com escopo de componente

**Escolha Quo.js se:**
- Você prefere estado centralizado
- Você precisa de arquitetura orientada a eventos
- Você quer middleware/efeitos para preocupações transversais
- Coordenação de estado entre funcionalidades é crítica

---

## MobX

### Modelo Conceitual

**MobX** usa programação reativa com observables. Mudanças de estado acionam automaticamente atualizações via proxies.

```typescript
// Abordagem MobX
class TodoStore {
 @observable todos = [];
 
 @action
 addTodo(todo) {
  this.todos.push(todo); // MobX rastreia esta mutação
 }
 
 @computed
 get completedCount() {
  return this.todos.filter(t => t.completed).length;
 }
}

// Uso
const store = new TodoStore();
const App = observer(() => {
 return <div>{store.completedCount}</div>; // Auto-atualiza
});
```

**Arquitetura:**
- Estado observable (proxies)
- Rastreamento automático de dependências
- Atualizações mutáveis (rastreadas via proxies)
- Baseado em classes ou funcional
- Granularidade fina por padrão

### Quando MobX Se Destaca

✅ **Reatividade implícita** 
MobX rastreia automaticamente dependências. Sem assinaturas manuais.

✅ **Atualizações de estilo mutável** 
Parece JavaScript simples. Não precisa de padrões imutáveis.

✅ **Granularidade fina por padrão** 
Componentes apenas re-renderizam quando seus observables específicos mudam.

✅ **Amigável para OOP** 
Encaixe natural para arquiteturas baseadas em classes.

### Quando Quo.js Se Destaca

✅ **Fluxo de eventos explícito** 
Eventos do Quo.js são rastreáveis. Reatividade do MobX é "mágica" (mais difícil de depurar).

✅ **Garantias de imutabilidade** 
Quo.js força atualizações imutáveis. MobX permite mutação (propenso a erros).

✅ **Depuração de viagem no tempo** 
Eventos do Quo.js criam um histórico reproduzível. Mutações do MobX são mais difíceis de rastrear.

✅ **Pipeline async** 
Quo.js tem um fluxo async estruturado. MobX requer gerenciamento manual de `runInAction`.

**Exemplo:**
```typescript
// MobX: Tratamento async manual
class Store {
 @observable loading = false;
 @observable data = null;
 
 @action
 async fetchData() {
  this.loading = true; // Deve envolver em action
  const res = await fetch('/api/data');
  runInAction(() => { // Deve envolver continuação async
   this.data = await res.json();
   this.loading = false;
  });
 }
}

// Quo.js: Pipeline async embutido
const middleware = async (state, event, emit) => {
 if (event.type === 'fetchData') {
  await emit('data', 'loading', true);
  const res = await fetch('/api/data');
  const data = await res.json();
  await emit('data', 'loaded', data);
  return false;
 }
 return true;
};
```

### Comparação de Desempenho

| Métrica | MobX | Quo.js |
|--------|------|--------|
| **Granularidade de Assinatura** | Nível de observable (fino) | Nível de caminho (fino) |
| **Frequência de Re-renderização** | Mínima | Mínima |
| **Tamanho de Bundle** | ~16KB | ~15KB |
| **Curva de Aprendizado** | Moderada (modelo de reatividade) | Moderada (modelo de eventos) |
| **Depuração** | Mais difícil (implícito) | Mais fácil (eventos explícitos) |

### Veredito

**Escolha MobX se:**
- Você prefere programação reativa
- Você gosta de atualizações de estilo mutável
- Você está construindo um app com muita OOP
- Você quer boilerplate mínimo

**Escolha Quo.js se:**
- Você prefere fluxo de eventos explícito
- Você quer garantias de imutabilidade
- Você precisa de depuração de viagem no tempo
- Você quer padrões async estruturados

---

## XState

### Modelo Conceitual

**XState** modela estado como máquinas de estados finitos (FSM). Transições de estado são explícitas e governadas por definições de máquina.

```typescript
// Abordagem XState
const todoMachine = createMachine({
 id: 'todo',
 initial: 'idle',
 states: {
  idle: {
   on: {
    FETCH: 'loading'
   }
  },
  loading: {
   invoke: {
    src: 'fetchTodos',
    onDone: {
     target: 'success',
     actions: 'assignTodos'
    },
    onError: 'failure'
   }
  },
  success: { /* ... */ },
  failure: { /* ... */ }
 }
});

const [state, send] = useMachine(todoMachine);
```

**Arquitetura:**
- Máquinas de estados
- Transições de estado explícitas
- Modelo de ator (mailboxes para mensagens)
- Diagramas visuais
- Orquestração async complexa

### Quando XState Se Destaca

✅ **Máquinas de estados complexas** 
XState se destaca quando transições de estado são numerosas e condicionais (ex., fluxos de checkout, formulários multi-etapa).

✅ **Modelagem visual** 
Máquinas XState podem ser visualizadas como diagramas, sendo excelente documentação.

✅ **Prevenção de estados impossíveis** 
XState torna transições de estado inválidas impossíveis por design.

✅ **Modelo de ator** 
Ótimo para coordenar múltiplos processos concorrentes.

### Quando Quo.js Se Destaca

✅ **Modelo mental mais simples** 
A abordagem orientada a eventos do Quo.js é mais fácil de entender para apps típicos. FSMs do XState têm uma curva de aprendizado íngreme.

✅ **Estado de propósito geral** 
Quo.js é melhor para apps CRUD onde estado não é estritamente uma "máquina". XState é excessivo para gerenciamento de dados simples.

✅ **Menos boilerplate** 
Máquinas XState são verbosas. Eventos e reducers do Quo.js são mais concisos.

**Exemplo:**
```typescript
// XState: Definição de máquina verbosa
const machine = createMachine({
 id: 'counter',
 initial: 'active',
 context: { count: 0 },
 states: {
  active: {
   on: {
    INCREMENT: {
     actions: assign({ count: (ctx) => ctx.count + 1 })
    },
    DECREMENT: {
     actions: assign({ count: (ctx) => ctx.count - 1 })
    }
   }
  }
 }
});

// Quo.js: Reducer conciso
const counterReducer = (state, event) => {
 switch (event.type) {
  case 'increment':
   return { count: state.count + 1 };
  case 'decrement':
   return { count: state.count - 1 };
  default:
   return state;
 }
};
```

### Comparação de Desempenho

| Métrica | XState | Quo.js |
|--------|--------|--------|
| **Adequação de Caso de Uso** | Workflows complexos | Gerenciamento de estado geral |
| **Tamanho de Bundle** | ~30KB | ~15KB |
| **Curva de Aprendizado** | Íngreme (conceitos FSM) | Moderada (modelo de eventos) |
| **Boilerplate** | Alto (definições de máquina) | Baixo (reducers) |
| **Visualização** | Excelente (diagramas) | Nenhuma (apenas eventos) |

### Veredito

**Escolha XState se:**
- Você está modelando workflows complexos (checkout, wizards, jogos)
- Você precisa de diagramas de estado visuais
- Você quer eliminar estados impossíveis
- Você se sente confortável com conceitos de máquina de estados

**Escolha Quo.js se:**
- Você está construindo apps CRUD típicos
- Você quer um modelo mental mais simples
- Você precisa de gerenciamento de estado de propósito geral
- Você quer menos boilerplate

---

## Tabela Resumo

| Funcionalidade | Redux Toolkit | Zustand | Jotai | MobX | XState | Quo.js |
|---------|---------------|---------|-------|------|--------|--------|
| **Arquitetura** | Centralizada | Centralizada | Distribuída | Observable | FSM | Centralizada + Eventos |
| **Suporte Async** | Thunks/RTK Query | Manual | Manual | `runInAction` | Embutido | Embutido |
| **Assinaturas** | Nível de slice | Nível de seletor | Nível de átomo | Nível de observable | Nível de estado | Nível de caminho |
| **Tamanho de Bundle** | ~45KB | ~1KB | ~3KB | ~16KB | ~30KB | ~15KB |
| **Curva de Aprendizado** | Moderada | Baixa | Baixa-Moderada | Moderada | Íngreme | Moderada |
| **Boilerplate** | Médio | Mínimo | Mínimo | Mínimo | Alto | Baixo-Médio |
| **DevTools** | Excelente | Bom | Bom | Bom | Excelente | Bom |
| **TypeScript** | Excelente | Bom | Excelente | Bom | Excelente | Excelente |
| **Imutabilidade** | Forçada (Immer) | Manual | Forçada | Opcional (proxies) | Forçada | Forçada |
| **Ordenamento de Eventos** | Sync | Nenhum | Nenhum | Nenhum | Explícito | Fila FIFO |
| **Suporte Node.js** | Sim | Não | Não | Sim | Sim | Sim |

---

## Matriz de Decisão

### Escolha Quo.js se você precisa de:

✅ **Desempenho de granularidade fina** sem otimização manual 
✅ **Suporte async nativo** sem bibliotecas externas 
✅ **Arquitetura orientada a eventos** com garantias de ordenamento 
✅ **Runtime universal** (web + Node.js + Deno + Bun) 
✅ **Eventos explícitos e rastreáveis** para depuração 
✅ **Organização baseada em canais** para apps grandes 

### Escolha Redux Toolkit se você precisa de:

✅ Ecossistema maduro com ferramentas extensivas 
✅ RTK Query para busca de dados 
✅ Familiaridade da equipe com padrões Redux 
✅ Depuração de viagem no tempo com Redux DevTools 

### Escolha Zustand se você precisa de:

✅ Tamanho de bundle mínimo (<5KB total) 
✅ API simples com zero boilerplate 
✅ Adoção gradual em apps existentes 

### Escolha Jotai se você precisa de:

✅ Estado distribuído baseado em átomos 
✅ Arquitetura Suspense-first 
✅ Composição de estado de baixo para cima 

### Escolha MobX se você precisa de:

✅ Modelo de programação reativa 
✅ Atualizações de estilo mutável 
✅ Arquitetura baseada em classes 

### Escolha XState se você precisa de:

✅ Máquinas de estados finitos 
✅ Modelagem de workflows complexos 
✅ Diagramas de estado visuais 

---

## Conclusão

Quo.js ocupa uma posição única no panorama de gerenciamento de estado:

- **Mais estruturado que Zustand** (eventos + canais vs. atualizações diretas)
- **Mais performático que Redux** (assinaturas atômicas por padrão)
- **Mais explícito que Jotai** (store centralizado vs. átomos distribuídos)
- **Mais depurável que MobX** (eventos explícitos vs. reatividade implícita)
- **Mais acessível que XState** (propósito geral vs. máquinas de estados)

Se você valoriza **fluxo de eventos explícito**, **desempenho de granularidade fina**, **suporte async nativo** e **compatibilidade de runtime universal**, Quo.js vale a pena avaliar.

---

**Leitura Adicional:**
- [Arquitetura de Fila de Eventos](./event-queue-architecture.md) - Mergulho técnico profundo na fila async do Quo.js
- [Guia de Início Rápido](https://quojs.dev) - Comece em 5 minutos
- [Referência de API](https://github.com/quojs/quojs/blob/main/packages/core/docs/README.md) - Documentação TypeDoc completa

---

**Histórico de Revisões**

| Versão | Data | Mudanças |
|---------|------|---------|
| 0.5.0 | 2026-01 | Comparação abrangente inicial |

---

**Licença:** MIT 
**Repositório:** https://github.com/quojs/quo 
**Site:** https://quojs.dev