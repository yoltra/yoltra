# Gerenciamento de Estado: Comparação Arquitetural

> [ 🇲🇽 Versión en Español](https://github.com/quojs/quojs/blob/main/docs/es/design/state-management-library-comparison.md)&nbsp; |
> &nbsp; 👉 [ 🇵🇹 Versão Portuguesa](https://github.com/quojs/quojs/blob/main/docs/pt/design/state-management-library-comparison.md)&nbsp; |
> &nbsp;[ 🇺🇸 English Version](https://github.com/quojs/quojs/blob/main/docs/en/design/state-management-library-comparison.md)&nbsp; |
> &nbsp;[ 🇫🇷 Version française](https://github.com/quojs/quojs/blob/main/docs/fr/design/state-management-library-comparison.md)

**Versão:** 0.7.0
**Última atualização:** Fevereiro 2026

## Introdução

As bibliotecas de gerenciamento de estado fazem **apostas arquiteturais** diferentes. Essas apostas determinam quais problemas cada biblioteca resolve mais naturalmente e onde ela gera atrito. Este documento examina essas diferenças arquiteturais de forma honesta — não para declarar um vencedor, mas para ajudar você a escolher a ferramenta certa para o seu problema específico.

Cada seção descreve o modelo central de uma biblioteca, explica a classe de aplicações em que esse modelo se destaca, e destaca como ele difere da abordagem do Quo.js.

---

## Quo.js em Resumo

O Quo.js é construído sobre três apostas arquiteturais:

1. **Assinaturas em nível de caminho** — Os componentes assinam caminhos com notação de pontos (`"items.0.title"`, `"items.*.done"`) e re-renderizam somente quando esse caminho exato muda.
2. **Pipeline de eventos estruturado** — Os eventos fluem através de um pipeline formal e extensível: dedup → middleware (pode rejeitar) → reducers → assinantes de eventos → effects → assinantes grossos.
3. **Eventos tipados por canal** — Os eventos são tuplas `(channel, type, payload)` em vez de strings de ação planas.

```typescript
// Path subscription: only re-renders when items[0].title changes
const title = useAtomicProp({
  reducer: 'todos',
  property: 'items.0.title',
});

// Channel-typed event
await emit('todos', 'toggle', { id: '123' });
```

**Onde essa arquitetura brilha:** Aplicações com muitos elementos de UI atualizando independentemente (dashboards, editores colaborativos, data grids, sistemas de partículas), aplicações que precisam de autorização/validação de eventos na camada de middleware, e apps universais que compartilham lógica de estado entre cliente e servidor.

**Onde ela gera atrito:** Apps simples onde a granularidade em nível de caminho é overhead desnecessário. Aplicações onde o tamanho do bundle deve ser inferior a 5KB. Projetos onde a equipe prefere atualizações no estilo mutável ou estado distribuído baseado em átomos.

---

## Redux Toolkit

### Arquitetura

O Redux Toolkit (RTK) é construído sobre **fluxo de dados unidirecional com reducers síncronos e puros**. O estado vive em um único store. As atualizações acontecem através de actions despachadas que são processadas por slice reducers. O Immer fornece atualizações imutáveis ergonômicas. A lógica assíncrona é tratada por thunks ou RTK Query.

```typescript
const todosSlice = createSlice({
  name: 'todos',
  initialState: { items: [] },
  reducers: {
    addTodo: (state, action) => {
      state.items.push(action.payload); // Immer-powered mutation syntax
    },
  },
});

dispatch(addTodo({ id: '1', title: 'Buy milk' }));
```

### Onde o Redux Toolkit se destaca

**Equipes grandes com padrões estabelecidos.** O Redux é a solução de gerenciamento de estado mais testada em batalha no React. Suas convenções estritas (actions, reducers, selectors) criam consistência em bases de código grandes. O RTK Query fornece uma solução completa de busca de dados com cache automático e re-busca. O ecossistema de DevTools é incomparável.

**Apps que precisam de middleware extensivo.** O modelo de middleware do Redux é maduro e possui milhares de soluções da comunidade para logging, analytics, persistência e rastreamento de erros.

### Diferenças arquiteturais em relação ao Quo.js

**Granularidade de assinatura.** As assinaturas do Redux operam no nível do store — `useSelector` executa em cada dispatch e depende de igualdade de referência para não re-renderizar. As assinaturas do Quo.js operam no nível de caminho e só disparam quando o caminho assinado realmente muda.

```typescript
// Redux: selector runs on EVERY dispatch, bails out via equality check
const title = useSelector(state => state.todos.items[0]?.title);

// Quo.js: subscription only fires when items.0.title changes
const title = useAtomicProp({
  reducer: 'todos',
  property: 'items.0.title',
});
```

Essa diferença importa mais em UIs com muitos elementos atualizando independentemente. Em uma lista de 100 itens, um `useSelector` do Redux em cada linha executa 100 vezes em cada dispatch. Um `useAtomicProp` do Quo.js em cada linha dispara somente para a linha específica que mudou.

**Modelo de eventos.** Actions do Redux são strings planas (`"todos/addTodo"`). Eventos do Quo.js são tuplas tipadas por canal (`('todos', 'add', payload)`). Ambas as abordagens funcionam; canais fornecem namespacing natural em escala, enquanto strings planas integram melhor com o Redux DevTools e o ecossistema de middleware.

**Modelo assíncrono.** O Redux separa reducers síncronos de thunks assíncronos. Middleware e effects do Quo.js são assíncronos por padrão — operações assíncronas fazem parte do pipeline central em vez de uma camada separada.

---

## Zustand

### Arquitetura

O Zustand é construído sobre **mutação direta de estado via uma função `set()`**. Estado e ações coexistem em uma única chamada `create()`. Não há actions, reducers ou middleware — apenas funções que chamam `set()`. As assinaturas usam funções seletoras.

```typescript
const useStore = create((set) => ({
  todos: [],
  addTodo: (todo) => set((state) => ({
    todos: [...state.todos, todo],
  })),
}));

const todos = useStore(state => state.todos);
```

### Onde o Zustand se destaca

**Apps pequenos a médios que valorizam simplicidade.** O Zustand tem a menor cerimônia de qualquer biblioteca de estado. Pesa aproximadamente 1KB. Praticamente não há curva de aprendizado — se você entende `useState`, você entende Zustand. É ideal para adicionar estado compartilhado a um app sem comprometimento arquitetural.

**Adoção gradual.** O Zustand não requer providers, contexto ou reestruturação. Você pode adicioná-lo a qualquer árvore de componentes incrementalmente.

### Diferenças arquiteturais em relação ao Quo.js

**Explicitação vs. minimalismo.** O Zustand otimiza para o menor código possível para fazer o estado funcionar. O Quo.js otimiza para transições de estado explícitas e rastreáveis via eventos. São valores fundamentalmente diferentes — o Zustand confia nos desenvolvedores para manter as coisas simples; o Quo.js fornece estrutura que escala.

```typescript
// Zustand: direct update — minimal but implicit
set((state) => ({ count: state.count + 1 }));

// Quo.js: named event — more ceremony but traceable
await emit('counter', 'increment', 1);
```

**Modelo de assinatura.** Seletores do Zustand são funções que executam em cada chamada `set()`. Otimizar para atualizações de granularidade fina requer funções de igualdade manuais. As assinaturas de caminho do Quo.js são de granularidade fina por padrão.

```typescript
// Zustand: needs custom equality to avoid unnecessary re-renders
const title = useStore(
  state => state.todos[0]?.title,
  (a, b) => a === b,
);

// Quo.js: fine-grained by default
const title = useAtomicProp({
  reducer: 'todos',
  property: 'items.0.title',
});
```

**Ordenamento de eventos.** As chamadas `set()` do Zustand são imediatas e síncronas. Múltiplas chamadas `set()` de diferentes operações assíncronas podem intercalar de forma imprevisível. A fila FIFO de eventos do Quo.js garante ordenamento estrito — eventos sempre processam na ordem em que foram emitidos.

**Tamanho do bundle.** O Zustand tem aproximadamente 1KB. O Quo.js (`@quojs/core` + `@quojs/react`) tem aproximadamente 15KB. Se o tamanho do bundle é a principal restrição, o Zustand vence claramente.

---

## Jotai

### Arquitetura

O Jotai usa **estado distribuído baseado em átomos**. Em vez de um store central, o estado é distribuído entre átomos independentes. Átomos podem derivar de outros átomos, formando um grafo de dependências. Componentes assinam átomos específicos e re-renderizam somente quando esses átomos mudam.

```typescript
const countAtom = atom(0);
const todosAtom = atom([]);
const completedCountAtom = atom(
  (get) => get(todosAtom).filter(t => t.completed).length,
);

const [count, setCount] = useAtom(countAtom);
```

### Onde o Jotai se destaca

**Estado de granularidade fina com escopo de componente.** O modelo de átomos do Jotai é inerentemente granular. Cada átomo é uma unidade independente de estado, e componentes só re-renderizam quando seus átomos específicos mudam. Isso torna o Jotai excelente para UIs onde o estado é naturalmente distribuído (campos de formulário, toggles, widgets independentes).

**Arquitetura Suspense-first.** O Jotai foi projetado para o React Suspense desde o início. Átomos assíncronos integram naturalmente com boundaries `<Suspense>`.

**Estado derivado componível.** Átomos que derivam de outros átomos criam um grafo reativo. Isso é poderoso para aplicações onde valores computados dependem de múltiplas fontes de estado independentes.

### Diferenças arquiteturais em relação ao Quo.js

**Centralizado vs. distribuído.** O Quo.js mantém uma única árvore de estado à qual você assina em caminhos específicos. O Jotai distribui o estado entre átomos independentes. Ambos alcançam reatividade de granularidade fina, mas através de arquiteturas opostas.

A abordagem centralizada (Quo.js) facilita raciocinar sobre estado global, coordenar atualizações transversais e serializar/restaurar o estado completo do app. A abordagem distribuída (Jotai) facilita criar unidades de estado autocontidas e reutilizáveis e evita a necessidade de um provider em casos simples.

```typescript
// Jotai: state is distributed across atoms
const titleAtom = atom('');
const doneAtom = atom(false);

// Quo.js: state lives in a tree, subscribed by path
const title = useAtomicProp({ reducer: 'todos', property: 'items.0.title' });
const done = useAtomicProp({ reducer: 'todos', property: 'items.0.done' });
```

**Rastreabilidade de eventos.** Atualizações de átomos do Jotai são implícitas — você chama `setCount(count + 1)` e o estado muda. Não há log de eventos, ponto de interceptação de middleware ou trilha de auditoria. Os eventos do Quo.js são explícitos e rastreáveis por todo o pipeline. Isso importa quando você precisa de verificações de autorização, undo/redo ou analytics sobre transições de estado.

**Middleware e preocupações transversais.** O Jotai lida com preocupações transversais (logging, persistência, validação) via middleware de átomos ou átomos wrapper — configuração por átomo. O Quo.js lida com elas centralmente via o pipeline de eventos — uma única função de middleware pode interceptar todos os eventos.

---

## MobX

### Arquitetura

O MobX usa **estado observable com rastreamento automático de dependências**. O estado é encapsulado em proxies que rastreiam quais propriedades cada componente lê. Quando uma propriedade observable muda, somente os componentes que a leram re-renderizam. As atualizações são no estilo mutável — você modifica o estado diretamente, e o MobX rastreia a mutação.

```typescript
class TodoStore {
  @observable todos = [];

  @action
  addTodo(todo) {
    this.todos.push(todo); // MobX tracks this mutation
  }

  @computed
  get completedCount() {
    return this.todos.filter(t => t.completed).length;
  }
}

const App = observer(() => {
  return <div>{store.completedCount}</div>; // Auto-updates
});
```

### Onde o MobX se destaca

**Reatividade implícita com boilerplate mínimo.** O MobX rastreia automaticamente quais propriedades um componente lê e re-renderiza somente quando essas propriedades mudam. Você não escreve seletores, assinaturas ou comparações de igualdade — simplesmente funciona. Isso é poderoso para desenvolvedores que querem reatividade de granularidade fina sem pensar nisso.

**Aplicações amigáveis a OOP.** Os stores baseados em classes do MobX com decorators se encaixam naturalmente em arquiteturas orientadas a objetos. Se sua equipe pensa em classes, propriedades computadas e estado encapsulado, o MobX parece nativo.

**Atualizações no estilo mutável.** O MobX permite escrever `this.todos.push(todo)` em vez de `{ ...state, todos: [...state.todos, todo] }`. Para atualizações aninhadas complexas, isso é significativamente mais legível.

### Diferenças arquiteturais em relação ao Quo.js

**Implícito vs. explícito.** O MobX rastreia dependências automaticamente via proxies — componentes re-renderizam "magicamente" quando observables que eles leem mudam. O Quo.js requer assinaturas de caminho explícitas — você declara o que está observando. O MobX é mais fácil de usar; o Quo.js é mais fácil de depurar quando as coisas dão errado.

**Mutabilidade.** O MobX permite (e encoraja) mutação direta de objetos de estado. O Quo.js enforça imutabilidade — o estado é deep-frozen em desenvolvimento. Ambas as abordagens têm tradeoffs: mutação é ergonômica mas pode causar bugs sutis quando referências são compartilhadas; imutabilidade é mais segura mas requer mais cerimônia para atualizações aninhadas.

**Fluxo de eventos.** O MobX não tem conceito de eventos ou ações como entidades de primeira classe (decorar com `@action` é para agrupamento, não para criar uma trilha de eventos). Os eventos do Quo.js fluem através de um pipeline formal com middleware, effects e fases committed/uncommitted. Se você precisa interceptar, validar ou auditar mudanças de estado, o Quo.js fornece a infraestrutura; o MobX requer construí-la você mesmo.

---

## XState

### Arquitetura

O XState modela estado como **máquinas de estados finitos e statecharts**. As transições de estado são explícitas e governadas por definições de máquina. Cada estado possível e transição é declarado previamente. O modelo de atores permite máquinas de estado concorrentes e isoladas que se comunicam via mensagens.

```typescript
const todoMachine = createMachine({
  id: 'todo',
  initial: 'idle',
  states: {
    idle: { on: { FETCH: 'loading' } },
    loading: {
      invoke: {
        src: 'fetchTodos',
        onDone: { target: 'success', actions: 'assignTodos' },
        onError: 'failure',
      },
    },
    success: { /* ... */ },
    failure: { /* ... */ },
  },
});
```

### Onde o XState se destaca

**Workflows complexos e com estado.** O XState é projetado para processos com muitos estados e transições condicionais — fluxos de checkout, formulários multi-etapa, lógica de jogos, implementações de protocolos. A definição de máquina garante que transições de estado inválidas sejam impossíveis.

**Modelagem e documentação visual.** Máquinas XState podem ser visualizadas como diagramas, sendo excelente documentação viva. O editor visual Stately permite que não-engenheiros entendam e validem a lógica de estado.

**Concorrência baseada em atores.** O modelo de atores do XState é computação concorrente genuína — múltiplas máquinas executando independentemente, comunicando-se via mensagens. Isso é poderoso para aplicações com processos independentes e paralelos.

### Diferenças arquiteturais em relação ao Quo.js

**Escopo.** O XState é projetado para **orquestração de workflows** — modelar processos que se movem através de fases distintas. O Quo.js é projetado para **gerenciamento de estado orientado a dados** — gerenciar estado de aplicação ao qual muitos elementos de UI assinam. Eles resolvem problemas diferentes e podem coexistir na mesma aplicação (XState para lógica de workflows, Quo.js para estado da aplicação).

**Boilerplate.** Definições de máquinas XState são verbosas por design — cada estado e transição é explícito. Isso é uma feature, não um bug, para workflows onde a explicitude previne erros. Mas para gerenciamento de estado CRUD geral, essa cerimônia é overhead.

```typescript
// XState: explicit machine for a counter
const machine = createMachine({
  id: 'counter',
  initial: 'active',
  context: { count: 0 },
  states: {
    active: {
      on: {
        INCREMENT: { actions: assign({ count: (ctx) => ctx.count + 1 }) },
        DECREMENT: { actions: assign({ count: (ctx) => ctx.count - 1 }) },
      },
    },
  },
});

// Quo.js: reducer for a counter
const counterReducer = (state, event) => {
  switch (event.type) {
    case 'increment': return { count: state.count + 1 };
    case 'decrement': return { count: state.count - 1 };
    default: return state;
  }
};
```

**Modelo de assinatura.** O XState não possui assinaturas em nível de caminho — você assina o estado da máquina e seleciona a partir dele. As assinaturas de caminho do Quo.js são mais granulares para gerenciamento de estado de UI.

---

## Resumo Arquitetural

Cada biblioteca otimiza para uma dimensão diferente:

| Biblioteca | Otimiza para | Tradeoff central |
|------------|-------------|------------------|
| **Redux Toolkit** | Maturidade do ecossistema, convenções de equipe | Mais boilerplate e setup, assinaturas mais grossas |
| **Zustand** | Superfície de API mínima, baixa cerimônia | Menos estrutura para fluxos async complexos |
| **Jotai** | Átomos distribuídos e componíveis | Mais difícil coordenar estado global |
| **MobX** | Reatividade implícita, ergonomia mutável | Mais difícil rastrear e depurar mudanças de estado |
| **XState** | Correção de workflows, estados impossíveis | Verboso para gerenciamento de dados geral |
| **Quo.js** | Assinaturas de granularidade fina, pipeline de eventos | Mais setup que Zustand/Jotai, bundle maior |

Não existe uma biblioteca universalmente "melhor". A escolha certa depende do que sua aplicação mais precisa:

- **Atrito mínimo e bundle pequeno?** Zustand ou Jotai.
- **Equipe já conhece Redux?** Redux Toolkit.
- **OOP reativo com atualizações mutáveis?** MobX.
- **Modelagem de workflows complexos?** XState.
- **Assinaturas de caminho de granularidade fina, autorização de eventos ou estado universal (cliente + servidor)?** Quo.js.

---

## Leitura Adicional

- **[Arquitetura de Fila de Eventos](./event-queue-architecture.md)** — Como o pipeline de eventos assíncronos do Quo.js funciona internamente
- **[Guia de Início Rápido](https://github.com/quojs/quojs/blob/main/docs/en/QUICK_START_GUIDE.md)** — Cinco passos para um app funcional
- **[API do @quojs/core](https://github.com/quojs/quojs/blob/main/packages/core/README.md)** — Store, middleware, effects, matchers `When`
- **[API do @quojs/react](https://github.com/quojs/quojs/blob/main/packages/react/README.md)** — Hooks com assinaturas de granularidade fina

---

**Licença:** MIT
**Repositório:** https://github.com/quojs/quojs
