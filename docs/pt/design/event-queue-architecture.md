# Arquitetura de Fila de Eventos

> [ 🇲🇽 Versión en Español](https://github.com/quojs/quojs/blob/main/docs/es/design/event-queue-architecture.md)&nbsp; |
> &nbsp; 👉 [ 🇵🇹 Versão Portuguesa](https://github.com/quojs/quojs/blob/main/docs/pt/event-queue-architecture.md)&nbsp; |
> &nbsp;[ 🇺🇸 English Version](https://github.com/quojs/quojs/blob/main/docs/en/design/event-queue-architecture.md)&nbsp; |
> &nbsp;[ 🇫🇷 Version française](https://github.com/quojs/quojs/blob/main/docs/fr/design/event-queue-architecture.md)

**Versão:** 0.5.0 
**Última atualização:** Janeiro 2026 
**Status:** Estável

## Visão Geral

O Quo.js emprega uma **fila de eventos assíncrona e serializada** com um guardião de reentrada para controle de contrapressão. Esta arquitetura garante ordenamento previsível de eventos e previne condições de corrida enquanto suporta middleware e efeitos assíncronos.

## Mecanismo Central

### Estrutura da Fila

```typescript
private readonly eventQueue: Array<{
  channel: string;
  type: string;
  payload: any;
  id: symbol;
}> = [];

private isProcessingQueue = false;
```

**Propriedades:**
- **Fila FIFO ilimitada** - Eventos enfileirados na ordem recebida
- **Flag de processamento única** - Previne operações de drenagem concorrentes
- **Deduplicação de eventos** - IDs de símbolos únicos previnem processamento duplo (segurança no Modo Estrito do React)

### Pipeline de Emissão

```typescript
public async emit<C, T>(
  channel: C,
  type: T,
  payload: EM[C][T]
): Promise<void>
```

**Passos:**

1. **Geração de ID** - Atribuir `Symbol` único ao evento
2. **Enfileirar** - Adicionar à `eventQueue` (sempre acontece)
3. **Verificação de Contrapressão** - Se `isProcessingQueue === true`, retornar imediatamente
4. **Adquirir Trava** - Definir `isProcessingQueue = true`
5. **Loop de Drenagem** - Processar todos os eventos enfileirados sequencialmente
6. **Liberar Trava** - Definir `isProcessingQueue = false`

### Fluxo de Processamento

```
┌─────────────────────────────────────────────────────────────┐
│ emit(channel, type, payload)                                │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
         ┌───────────────┐
         │ Gerar ID      │
         └───────┬───────┘
                 │
                 ▼
         ┌───────────────┐
         │ Enfileirar    │
         └───────┬───────┘
                 │
                 ▼
         ┌────────────────────┐
         │ isProcessingQueue? │
         └───────┬────────┬───┘
                 │        │
            SIM  │        │ NÃO
                 │        │
                 ▼        ▼
         ┌────────┐  ┌──────────────┐
         │ Retorno│  │ Flag=true    │
         └────────┘  └──────┬───────┘
                            │
                            ▼
                    ┌───────────────┐
                    │ while(queue)  │
                    └───────┬───────┘
                            │
                            ▼
                    ┌───────────────────┐
                    │ Deduplicação      │
                    └───────┬───────────┘
                            │
                            ▼
                    ┌───────────────────┐
                    │ Middleware        │
                    │ (pode cancelar)   │
                    └───────┬───────────┘
                            │
                            ▼
                    ┌───────────────────┐
                    │ Reducers (sync)   │
                    └───────┬───────────┘
                            │
                            ▼
                    ┌───────────────────┐
                    │ Efeitos (async)   │
                    └───────┬───────────┘
                            │
                            ▼
                    ┌───────────────────┐
                    │ Assinantes        │
                    └───────┬───────────┘
                            │
                            ▼
                    ┌───────────────────┐
                    │ DevTools          │
                    └───────┬───────────┘
                            │
                            ▼
                    ┌───────────────┐
                    │ Flag=false    │
                    └───────────────┘
```

## Modelo de Contrapressão

### Guardião de Reentrada

O store usa uma **flag booleana** (`isProcessingQueue`) para implementar contrapressão:

```typescript
if (this.isProcessingQueue) return;  // Contrapressão aplicada aqui
```

**Mecanismo:**

- **Primeira chamada `emit()`** adquire a trava e inicia a drenagem
- **Chamadas subsequentes `emit()`** (durante a drenagem) enfileiram e retornam imediatamente
- **Chamadas aninhadas `emit()`** (de middleware/efeitos) são enfileiradas para processamento posterior

### Modelo de Execução

Quo.js usa um modelo de **"passagem de bastão"** onde a primeira chamada desbloqueada para `emit()` consome toda a fila:

```
Linha do tempo:

T0: emit('evento1') [Componente A]
    → isProcessingQueue = false
    → Adquirir trava
    → Iniciar loop de drenagem
   
T1: emit('evento2') [Middleware durante evento1]
    → isProcessingQueue = true (BLOQUEADO)
    → Apenas enfileirar
    → Retornar imediatamente
   
T2: emit('evento3') [Efeito durante evento1]
    → isProcessingQueue = true (BLOQUEADO)
    → Apenas enfileirar
    → Retornar imediatamente
   
T3: Loop de drenagem continua [emit('evento1') original]
    → Processar evento1
    → Processar evento2 (retirado da fila)
    → Processar evento3 (retirado da fila)
    → Liberar trava
    → Retornar
```

**Propriedade Chave:** Não há **thread consumidor separado ou worker**. O consumo da fila é totalmente impulsionado por chamadas `emit()`.

## Garantias de Ordenamento

### Ordenamento FIFO

Eventos são processados em ordem estrita de enfileiramento:

```typescript
await emit('ui', 'evento1', p1);  // Enfileirado no índice 0
await emit('ui', 'evento2', p2);  // Enfileirado no índice 1
await emit('ui', 'evento3', p3);  // Enfileirado no índice 2

// Ordem de processamento: evento1 → evento2 → evento3 (garantido)
```

### Serialização

Eventos **nunca** processam concorrentemente:

```typescript
while (this.eventQueue.length) {
  const event = this.eventQueue.shift()!;
 
  // Deduplicação
  if (this.processedEventIds.has(event.id)) continue;
  this.processedEventIds.add(event.id);
 
  // Middleware (async)
  for (const mw of this.middleware) {
    const ok = await mw(state, event, emit);  // ← Aguarda cada um
    if (!ok) break;
  }
 
  // Reducers (sync)
  this.reducerBus.emit(event.channel, event.type, event.payload);
 
  // Efeitos (async)
  await this.notifyEffects(event);  // ← Aguarda completação
 
  // Assinantes (sync)
  if (stateChanged) this.listeners.forEach(l => l());
 
  // DevTools (sync)
  this.devtools?.send(action, state);
}
```

**Propriedade:** O próximo evento na fila não começa a processar até que o evento atual complete todo seu pipeline (incluindo efeitos assíncronos).

### Segurança de Reentrada

Chamadas aninhadas `emit()` durante processamento de eventos são seguras:

```typescript
// Middleware que emite
const middleware: MiddlewareFunction = async (state, event, emit) => {
  if (event.type === 'fetchData') {
    await emit('ui', 'loading', true);     // ← Emit aninhado
    const data = await fetch('/api');
    await emit('data', 'loaded', data);    // ← Emit aninhado
  }
  return true;
};

// Código do usuário
await emit('api', 'fetchData', { url: '/todos' });
// Resultado: 'fetchData' → 'loading' → 'loaded' (em ordem)
```

## Modelo de Concorrência

### JavaScript Single-Threaded

O event loop do JavaScript garante que apenas uma chamada `emit()` execute por vez:

```typescript
// Componente A (microtarefa 1)
emit('evento1');

// Componente B (microtarefa 2)
emit('evento2');

// Execução real:
// 1. emit('evento1') executa até completar (ou ceder para await)
// 2. emit('evento2') executa (pode enfileirar se evento1 ainda está drenando)
```

### Agendamento de Microtarefas

Async/await coloca continuações na fila de microtarefas:

```typescript
async function exemplo() {
  await emit('evento1');  // Cede aqui
  // Continuação agendada como microtarefa
  console.log('após evento1');
}
```

**Implicação:** Múltiplas chamadas `emit()` de diferentes componentes podem intercalar em limites de await, mas o ordenamento da fila é preservado.

## Deduplicação de Eventos

### Proteção do Modo Estrito do React

React 18+ Modo Estrito executa efeitos duas vezes em desenvolvimento:

```typescript
useEffect(() => {
  emit('analytics', 'pageView', { page });  // Dispara 2x em dev!
}, [page]);
```

**Solução:** Rastreamento de IDs de eventos previne processamento duplo:

```typescript
private readonly processedEventIds = new Set<symbol>();

// No loop de drenagem:
if (this.processedEventIds.has(event.id)) continue;  // Pular duplicado
this.processedEventIds.add(event.id);
```

### Estratégia de Limpeza

IDs são periodicamente limpos para prevenir vazamentos de memória:

```typescript
// Construtor
this.eventIdCleanupTimer = setInterval(() => {
  this.processedEventIds.clear();
}, cleanupInterval);  // 30s dev, 5min prod

// Disposição
public dispose(): void {
  if (this.eventIdCleanupTimer) {
    clearInterval(this.eventIdCleanupTimer);
    this.eventIdCleanupTimer = null;
  }
  this.processedEventIds.clear();
}
```

**Suposição:** Eventos mais antigos que o intervalo de limpeza nunca serão re-emitidos (seguro para a maioria das aplicações).

## Características de Desempenho

### Complexidade Temporal

| Operação | Complexidade | Notas |
|-----------|------------|-------|
| `emit()` enfileirar | O(1) | Push de array |
| `emit()` drenar (fila vazia) | O(n×m) | n = eventos, m = middleware+efeitos |
| `emit()` drenar (fila tem eventos) | O(1) | Retorna imediatamente |
| Deduplicação de eventos | O(1) | Busca em Set |
| Pipeline de middleware | O(k) | k = número de middlewares |
| Dispatch de reducer | O(1) | Emissão direta EventBus |
| Dispatch de efeito | O(1) | Busca em Map por chave |

### Complexidade Espacial

| Estrutura | Complexidade | Notas |
|-----------|------------|-------|
| `eventQueue` | O(n) | n = eventos enfileirados (ilimitado) |
| `processedEventIds` | O(m) | m = eventos desde última limpeza |
| `middleware` | O(k) | k = middlewares registrados |
| `effects` | O(e) | e = efeitos registrados |

### Gargalos

1. **Reducers Lentos** - Bloqueiam toda a fila (síncrono)
2. **Middleware Lento** - Bloqueia processamento de eventos (async mas sequencial)
3. **Efeitos Lentos** - Bloqueiam próximo evento na fila (async mas sequencial)
4. **Crescimento da Fila** - Uso de memória ilimitado se eventos enfileiram mais rápido que processamento

## Modos de Falha

### Transbordamento de Fila (Crescimento Ilimitado)

**Cenário:** Eventos enfileiram mais rápido do que podem ser processados.

```typescript
// Caso patológico: Emissão recursiva
registerEffect({
  events: [['ui', 'tick']],
  effect: async (evt, getState, emit) => {
    await emit('ui', 'tick', evt.payload + 1);  // Recursão infinita!
  }
});

emit('ui', 'tick', 0);  // Fila cresce sem limite
```

**Sintomas:**
- Uso crescente de memória
- Desempenho degradado
- Eventual crash por OOM

**Mitigação:** Aplicação deve evitar loops infinitos. Store não tem proteção embutida.

### Inanição do Event Loop

**Cenário:** Reducer de longa execução bloqueia o event loop.

```typescript
reducer: (state, event) => {
  // Computação síncrona e cara
  for (let i = 0; i < 1e9; i++) {
    // Trabalho intensivo de CPU
  }
  return { ...state, result: i };
}
```

**Sintomas:**
- UI congela
- Outros eventos presos na fila
- Má experiência do usuário

**Mitigação:** Manter reducers rápidos e puros. Mover computação pesada para efeitos ou Web Workers.

### Cancelamento de Middleware

**Cenário:** Middleware cancela evento retornando `false`.

```typescript
const authMiddleware: MiddlewareFunction = (state, event) => {
  if (!state.auth.isAuthenticated) {
    console.warn('Evento não autorizado:', event);
    return false;  // Cancelar propagação
  }
  return true;
};
```

**Comportamento:**
- Evento é desenfileirado mas não processado
- Reducers e efeitos nunca veem o evento
- Assinantes não são notificados
- Evento é perdido (sem mecanismo de retry)

**Consideração:** Garantir que cancelamento seja intencional e apropriadamente registrado.

### Erros de Efeitos

**Cenário:** Efeito lança um erro.

```typescript
registerEffect({
  events: [['api', 'fetch']],
  effect: async (evt) => {
    const res = await fetch(evt.payload.url);
    const data = await res.json();  // Pode lançar se não for JSON
    // ...
  }
});
```

**Comportamento:**
- Erro é capturado e registrado: `console.error("Erro de efeito:", err);`
- Outros efeitos ainda executam
- Drenagem da fila continua
- Aplicação deve tratar estado de erro via eventos de erro

**Melhor Prática:** Efeitos devem capturar erros e emitir eventos de falha:

```typescript
effect: async (evt, getState, emit) => {
  try {
    const data = await fetchData(evt.payload.url);
    await emit('api', 'fetchSuccess', data);
  } catch (error) {
    await emit('api', 'fetchFailure', { error: error.message });
  }
}
```

## Comparação com Outras Bibliotecas

### Redux (Síncrono)

```typescript
// Redux: Processamento imediato e síncrono
dispatch({ type: 'ADD_TODO', payload: todo });
// ↑ Bloqueia até todos os reducers completarem
// ↑ Sem fila, sem suporte async

const state = store.getState();  // Reflete mudança imediatamente
```

**Propriedades:**
- ✅ Temporização previsível
- ✅ Modelo mental simples
- ❌ Sem suporte de middleware async (requer redux-thunk/saga)
- ❌ Bloqueia event loop se reducer for lento

### Zustand (Síncrono)

```typescript
// Zustand: Atualizações de estado imediatas e síncronas
set({ todos: [...todos, newTodo] });
// ↑ Mutação síncrona + notificação

get().todos;  // Tem imediatamente o novo todo
```

**Propriedades:**
- ✅ Overhead mínimo
- ✅ API simples
- ❌ Sem padrões async embutidos
- ❌ Sem garantias de ordenamento de eventos com atualizações concorrentes

### XState (Modelo de Ator)

```typescript
// XState: Mailbox de ator assíncrono
actor.send({ type: 'FETCH' });
actor.send({ type: 'UPDATE' });
// ↑ Eventos enfileirados no mailbox do ator
// ↑ Processados assincronamente pela máquina de estados

// Múltiplos atores podem processar concorrentemente
```

**Propriedades:**
- ✅ Verdadeiro processamento concorrente (múltiplos atores)
- ✅ Semântica de máquina de estados async embutida
- ❌ Modelo mental complexo
- ❌ Maior overhead de memória (um mailbox por ator)

### Quo.js (Fila Assíncrona)

```typescript
// Quo.js: Fila assíncrona serializada
await emit('todo', 'add', todo);
// ↑ Retorna promise quando processamento completa
// ↑ Enfileirado se outro evento está processando

await emit('todo', 'delete', id);
// ↑ Garantido processar após 'add'
```

**Propriedades:**
- ✅ Suporte de middleware/efeitos async
- ✅ Garantias estritas de ordenamento
- ✅ Seguro para reentrada
- ❌ Fila ilimitada (risco de memória)
- ❌ Sem processamento paralelo (fila única)

## Justificativa do Design

### Por Que Assíncrono?

**Requisito:** Suportar middleware e efeitos assíncronos sem bloquear a aplicação.

**Alternativa Considerada:** Modelo síncrono (como Redux)
- **Rejeitada:** Requer camada de orquestração async separada (thunks, sagas)
- **Escolhida:** Suporte async embutido via tipo de retorno `Promise<void>`

### Por Que Fila Única?

**Requisito:** Garantir ordenamento de eventos para transições de estado previsíveis.

**Alternativa Considerada:** Múltiplas filas (por canal ou por reducer)
- **Rejeitada:** Semântica de ordenamento complexa, potenciais condições de corrida
- **Escolhida:** Fila única garante ordenamento global

### Por Que Guardião de Reentrada?

**Requisito:** Prevenir corrupção de fila por chamadas aninhadas `emit()`.

**Alternativa Considerada:** Proibir emits aninhados (lançar erro)
- **Rejeitada:** Quebra padrões comuns (middleware emitindo eventos)
- **Escolhida:** Enfileirar e adiar eventos aninhados

### Por Que Sem Limite de Fila?

**Requisito:** Nunca descartar eventos em produção (risco de perda de dados).

**Alternativa Considerada:** Buffer circular de tamanho fixo com política de transbordamento
- **Considerada:** Poderia descartar eventos ou lançar erros em transbordamento
- **Escolhida:** Fila ilimitada prioriza correção sobre segurança de memória
- **Futuro:** Pode adicionar limites opcionais com políticas configuráveis


-------


## Apêndice: Referência de Implementação

### Loop de Eventos Central

```typescript
public async emit<C extends keyof EM, T extends keyof EM[C]>(
  channel: C,
  type: T,
  payload: EM[C][T],
): Promise<void> {
  const id = Symbol("event");
 
  this.eventQueue.push({
    channel: channel as string,
    type: type as string,
    payload,
    id,
  });

  if (this.isProcessingQueue) return;

  this.isProcessingQueue = true;
  try {
    while (this.eventQueue.length) {
      const { channel, type, payload, id } = this.eventQueue.shift()!;

      if (this.processedEventIds.has(id)) {
        continue;
      }

      this.processedEventIds.add(id);

      const event = { channel, type, payload, id } as Event<EM, C, T>;
      let propagate = true;

      for (const mw of this.middleware) {
        try {
          const ok = await mw(this.state, event, this.emit);
          if (!ok) {
            propagate = false;
            break;
          }
        } catch (err) {
          console.error("Erro de middleware:", err);
          propagate = false;
          break;
        }
      }

      if (!propagate) {
        this.devtools?.send(
          { type: `Channel: ${channel} - Type: ${type} [CANCELADO]`, payload },
          this.state,
        );
        continue;
      }

      const stateBefore = this.state;
      this.reducerBus.emit(channel as C, type as T, payload);
      const stateAfter = this.state;
      const anySliceChanged = stateBefore !== stateAfter;

      await this.notifyEffects(event as any);

      if (anySliceChanged) {
        this.listeners.forEach((l) => l());
      }

      this.devtools?.send(
        { type: `Channel: ${channel} - Type: ${type}`, payload },
        this.state,
      );
    }
  } catch (err) {
    console.error("Erro de fila emit:", err);
  } finally {
    this.isProcessingQueue = false;
  }
}
```

### Deduplicação de Eventos

```typescript
private readonly processedEventIds = new Set<symbol>();
private eventIdCleanupTimer: ReturnType<typeof setInterval> | null = null;

constructor(spec: StoreSpec<R, S, EM>) {
  // ...
 
  const cleanupInterval =
    process.env.NODE_ENV === "production" ? 5 * 60 * 1000 : 30 * 1000;
   
  this.eventIdCleanupTimer = setInterval(() => {
    this.processedEventIds.clear();
  }, cleanupInterval);
}

public dispose(): void {
  if (this.eventIdCleanupTimer) {
    clearInterval(this.eventIdCleanupTimer);
    this.eventIdCleanupTimer = null;
  }
  this.processedEventIds.clear();
}
```

---

## Glossário

**Contrapressão**: Mecanismo para prevenir transbordamento de fila desacelerando ou bloqueando produção de eventos.

**Passagem de Bastão**: Modelo de execução onde controle transfere de uma operação async para outra.

**Loop de Drenagem**: O loop `while` que processa todos os eventos enfileirados sequencialmente.

**FIFO**: First-In-First-Out - eventos são processados em ordem de enfileiramento.

**Reentrada**: Propriedade permitindo que função seja chamada enquanto já está executando.

**Serialização**: Processar eventos um de cada vez, nunca concorrentemente.

---

## Histórico de Revisões

| Versão | Data | Mudanças |
|---------|------|---------|
| 0.5.0 | 2026-01 | Documentação inicial da arquitetura de fila async |

---

**Autor**: Equipe Quo.js 
**Licença**: MIT 
**Repositório**: https://github.com/quojs/quo