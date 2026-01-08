# Comparación de Bibliotecas de Gestión de Estado

>  👉 [ 🇲🇽 Versión en Español](https://github.com/quojs/quojs/blob/main/docs/es/design/state-management-library-comparison.md)&nbsp; |
> &nbsp;[ 🇵🇹 Versão Portuguesa](https://github.com/quojs/quojs/blob/main/docs/pt/design/state-management-library-comparison.md)&nbsp; |
> &nbsp;[ 🇺🇸 English Version](https://github.com/quojs/quojs/blob/main/docs/en/design/state-management-library-comparison.md)&nbsp; |
> &nbsp;[ 🇫🇷 Version française](https://github.com/quojs/quojs/blob/main/docs/fr/design/state-management-library-comparison.md)

**Versión:** 0.5.0
**Última actualización:** Enero 2026

## Descripción General

Este documento proporciona una comparación técnica honesta de Quo.js contra bibliotecas populares de gestión de estado. Cada comparación explora diferencias arquitectónicas, ajuste de casos de uso, características de rendimiento y experiencia del desarrollador.

---

## ¿Qué es Quo.js?

**Quo.js es un contenedor de estado impulsado por eventos, async-first con suscripciones atómicas.**

### Arquitectura Central

```typescript
// Impulsado por eventos: Los eventos fluyen a través de canales
emit('todo', 'addItem', { title: 'Comprar leche' });

// Async-first: Middleware y efectos asíncronos incorporados
const middleware = async (state, event, emit) => {
 await trackAnalytics(event);
 return true;
};

// Suscripciones atómicas: Suscribirse a rutas de estado exactas
useAtomicProp({ reducer: 'todos', property: 'items.0.title' });
// ↑ Solo re-renderiza cuando items[0].title cambia
```

### Características Clave

| Aspecto | Descripción |
|--------|-------------|
| **Patrón Arquitectónico** | Arquitectura impulsada por eventos con enrutamiento basado en canales |
| **Modelo de Estado** | Store centralizado con slices con espacios de nombres |
| **Modelo de Eventos** | Cola FIFO con eventos `(channel, type, payload)` |
| **Modelo de Suscripción** | Suscripciones atómicas de grano fino mediante rutas con puntos |
| **Modelo Asíncrono** | Emit basado en Promise + middleware asíncrono + efectos |
| **Modelo de Ejecución** | Procesamiento de eventos serializado (uno a la vez, en orden) |
| **Runtime** | Universal (navegador + Node.js + Deno + Bun) |

### ¿Qué Problemas Resuelve Quo.js?

1. **Rendimiento**: Elimina re-renderizados innecesarios mediante suscripciones atómicas de ruta
2. **Complejidad**: Soporte asíncrono nativo sin thunks/sagas/observables
3. **Organización**: Eventos basados en canales previenen colisiones de nombres de tipo de acción
4. **Previsibilidad**: Garantías estrictas de ordenamiento de eventos aseguran transiciones de estado determinísticas
5. **Flexibilidad**: Funciona en aplicaciones web, servidores Node, herramientas CLI, microservicios

---

## Redux Toolkit

### Modelo Conceptual

**Redux Toolkit (RTK)** es el conjunto de herramientas oficial y con opinión de Redux que reduce el código repetitivo mientras mantiene los principios fundamentales de Redux: flujo de datos unidireccional, actualizaciones inmutables y reducers puros.

```typescript
// Enfoque Redux Toolkit
const todosSlice = createSlice({
 name: 'todos',
 initialState: { items: [] },
 reducers: {
  addTodo: (state, action) => {
   state.items.push(action.payload); // Mutación con Immer
  }
 }
});

// Async mediante thunks
const fetchTodos = createAsyncThunk('todos/fetch', async (url) => {
 const res = await fetch(url);
 return res.json();
});

// Uso
dispatch(addTodo({ id: 1, title: 'Comprar leche' }));
dispatch(fetchTodos('/api/todos'));
```

**Arquitectura:**
- Store único con reducers de slice
- Tipos de acción planos (`'todos/addTodo'`)
- Reducers síncronos (Immer para inmutabilidad)
- Async mediante thunks o RTK Query
- Suscripciones gruesas (re-renderizado en cualquier cambio de slice a menos que se optimice manualmente)

### Cuándo Redux Toolkit Sobresale

✅ **Equipos grandes con patrones Redux establecidos** 
Redux está probado en batalla a escala. Si tu equipo ya conoce Redux, RTK es el camino de actualización obvio.

✅ **Obtención de datos mediante RTK Query** 
RTK Query proporciona caché automático, re-obtención y actualizaciones optimistas: una solución completa de obtención de datos.

✅ **Ecosistema DevTools** 
Redux DevTools es maduro, ampliamente adoptado y tiene extensas integraciones de terceros.

✅ **Madurez del ecosistema** 
Miles de middlewares, mejoradores y herramientas disponibles. Existen soluciones para cada caso extremo.

### Cuándo Quo.js Sobresale

✅ **Optimización de rendimiento de grano fino** 
Las suscripciones atómicas de Quo.js eliminan re-renderizados por defecto. RTK requiere optimización manual de `useSelector`.

**Ejemplo:**
```typescript
// RTK: El componente completo se re-renderiza cuando CUALQUIER todo cambia
const todos = useSelector(state => state.todos.items);

// Quo.js: Solo se re-renderiza cuando el título de ESTE todo específico cambia
const title = useAtomicProp({ 
 reducer: 'todos', 
 property: 'items.0.title' 
});
```

✅ **Patrones asíncronos incorporados** 
El middleware y efectos de Quo.js son asíncronos por defecto. Sin thunks, sin configuración de RTK Query.

**Ejemplo:**
```typescript
// Quo.js: Middleware asíncrono incorporado
const middleware = async (state, event, emit) => {
 if (event.type === 'fetchTodos') {
  const data = await fetch('/api/todos').then(r => r.json());
  await emit('todos', 'loadSuccess', data);
  return false; // Cancelar evento original
 }
 return true;
};

// RTK: Requiere thunk/RTK Query
const fetchTodos = createAsyncThunk('todos/fetch', async () => {
 return fetch('/api/todos').then(r => r.json());
});
```

✅ **Organización basada en canales** 
Los eventos de Quo.js están espaciados por canal, previniendo colisiones de nombres en aplicaciones grandes.

**Ejemplo:**
```typescript
// Quo.js: Espacios de nombres claros
emit('user', 'update', data);
emit('analytics', 'track', event);
emit('api', 'request', config);

// RTK: Los tipos de acción planos requieren nombres cuidadosos
dispatch({ type: 'user/update' });
dispatch({ type: 'analytics/track' });
dispatch({ type: 'api/request' });
```

✅ **Runtime universal** 
Quo.js no tiene dependencias del DOM. Úsalo en servidores Node.js, herramientas CLI o microservicios.

### Comparación de Rendimiento

| Métrica | Redux Toolkit | Quo.js |
|--------|---------------|--------|
| **Granularidad de Suscripción** | Nivel de slice (optimización manual) | Nivel de ruta (automático) |
| **Frecuencia de Re-renderizado** | Alta (sin optimización) | Mínima (atómico por defecto) |
| **Overhead Asíncrono** | Capa de thunk + creadores de acción | Pipeline asíncrono incorporado |
| **Tamaño de Bundle** | ~45KB (RTK + React-Redux) | ~15KB (@quojs/core + @quojs/react) |
| **Huella de Memoria** | Mayor (suscripciones al árbol de estado completo) | Menor (suscripciones específicas de ruta) |

### Ruta de Migración: RTK → Quo.js

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

// DESPUÉS (Quo.js v0.5.0)
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

### Veredicto

**Elige Redux Toolkit si:**
- Tu equipo ya es competente en Redux
- Necesitas las capacidades de obtención de datos de RTK Query
- Dependes fuertemente del ecosistema Redux
- Prefieres soluciones con opinión e incluidas

**Elige Quo.js si:**
- El rendimiento (optimización de re-renderizado) es crítico
- Quieres soporte asíncrono nativo sin capas
- Estás construyendo aplicaciones universales (web + Node.js)
- Prefieres APIs explícitas y mínimas

---

## Zustand

### Modelo Conceptual

**Zustand** es una biblioteca de gestión de estado minimalista construida sobre hooks de React. Evita el código repetitivo de Redux por una simple API `create` + `set`.

```typescript
// Enfoque Zustand
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

**Arquitectura:**
- Store único con actualizaciones directas de estado
- Sin acciones o eventos (solo funciones)
- Síncrono por defecto
- Suscripciones mediante funciones selectoras
- Superficie de API mínima (~1KB)

### Cuándo Zustand Sobresale

✅ **Código repetitivo mínimo** 
Zustand tiene la menor ceremonia de cualquier biblioteca de estado. Define estado + acciones en un solo lugar.

✅ **Tamaño de bundle pequeño** 
~1KB hace a Zustand ideal para aplicaciones con restricciones de tamaño.

✅ **Modelo mental simple** 
Sin eventos, sin reducers, sin middleware: solo funciones que llaman a `set()`.

✅ **Adopción gradual** 
Fácil de agregar a proyectos existentes sin refactorización mayor.

### Cuándo Quo.js Sobresale

✅ **Complejidad asíncrona** 
Quo.js maneja flujos de trabajo asíncronos de forma nativa. Zustand requiere orquestación manual.

**Ejemplo:**
```typescript
// Zustand: Manejo asíncrono manual
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

// Quo.js: Pipeline asíncrono incorporado
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

✅ **Garantías de ordenamiento de eventos** 
La cola FIFO de Quo.js asegura transiciones de estado determinísticas. Las llamadas `set()` de Zustand pueden intercalarse de forma impredecible.

✅ **Suscripciones de grano fino** 
Zustand requiere optimización manual de selectores. Las suscripciones atómicas de Quo.js están incorporadas.

**Ejemplo:**
```typescript
// Zustand: Re-renderiza cuando CUALQUIER todo cambia (sin optimización)
const todos = useStore(state => state.todos);

// Zustand optimizado: Selector manual
const firstTodo = useStore(
 state => state.todos[0],
 (a, b) => a?.id === b?.id // Igualdad personalizada
);

// Quo.js: Suscripción de grano fino automática
const firstTodo = useAtomicProp({ 
 reducer: 'todos', 
 property: 'items.0' 
});
```

✅ **Historial de eventos estructurado** 
Los eventos de Quo.js son de primera clase, haciendo la depuración de viaje en el tiempo y análisis más fáciles.

### Comparación de Rendimiento

| Métrica | Zustand | Quo.js |
|--------|---------|--------|
| **Granularidad de Suscripción** | Nivel de selector (manual) | Nivel de ruta (automático) |
| **Frecuencia de Re-renderizado** | Media (con optimización) | Mínima (atómico por defecto) |
| **Tamaño de Bundle** | ~1KB | ~15KB |
| **Complejidad de Configuración** | Mínima | Moderada |
| **Patrones Asíncronos** | Manual | Incorporados |

### Ruta de Migración: Zustand → Quo.js

```typescript
// ANTES (Zustand)
const useStore = create((set) => ({
 count: 0,
 increment: () => set((state) => ({ count: state.count + 1 })),
 decrement: () => set((state) => ({ count: state.count - 1 }))
}));

// DESPUÉS (Quo.js v0.5.0)
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

### Veredicto

**Elige Zustand si:**
- El tamaño de bundle es crítico (<5KB total)
- Quieres la API más simple posible
- Tu app tiene complejidad asíncrona mínima
- Estás construyendo una app pequeña a mediana

**Elige Quo.js si:**
- Necesitas patrones asíncronos robustos
- La optimización de rendimiento es crítica
- Quieres garantías de ordenamiento de eventos
- Estás construyendo una app grande y compleja

---

## Jotai

### Modelo Conceptual

**Jotai** toma un enfoque basado en átomos inspirado en Recoil. El estado está distribuido entre átomos en lugar de centralizado.

```typescript
// Enfoque Jotai
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

**Arquitectura:**
- Estado distribuido (átomos)
- Composición de abajo hacia arriba
- Actualizaciones atómicas (grano fino por diseño)
- Suspense-first
- Sin store central

### Cuándo Jotai Sobresale

✅ **Reactividad de grano fino** 
Los átomos son inherentemente granulares. Los re-renderizados son mínimos por diseño.

✅ **Integración con Suspense** 
Jotai fue construido para Suspense desde el primer día.

✅ **Estado componible** 
Los átomos pueden depender de otros átomos, creando grafos de estado derivado.

✅ **Sin store global** 
Genial para estado a nivel de componente o con alcance de funcionalidad.

### Cuándo Quo.js Sobresale

✅ **Modelo de estado centralizado** 
Quo.js mantiene una única fuente de verdad. Más fácil de razonar para apps grandes.

✅ **Arquitectura impulsada por eventos** 
Los eventos de Quo.js crean un rastro de auditoría. Las actualizaciones de átomos de Jotai son implícitas.

**Ejemplo:**
```typescript
// Jotai: Actualizaciones implícitas
setCount(count + 1); // ¿De dónde vino esto? ¿Quién lo activó?

// Quo.js: Eventos explícitos
emit('counter', 'increment', 1); // Intención clara, rastreable
```

✅ **Middleware y efectos** 
Quo.js tiene un pipeline asíncrono central. Jotai requiere gestión de efectos por átomo.

✅ **Coordinación de estado global** 
Quo.js sobresale cuando las actualizaciones de estado deben coordinarse entre múltiples slices (ej., autenticación afectando estado de UI).

### Comparación de Rendimiento

| Métrica | Jotai | Quo.js |
|--------|-------|--------|
| **Granularidad de Suscripción** | Nivel de átomo (fino por diseño) | Nivel de ruta (fino por diseño) |
| **Frecuencia de Re-renderizado** | Mínima | Mínima |
| **Tamaño de Bundle** | ~3KB | ~15KB |
| **Complejidad de Configuración** | Baja | Moderada |
| **Modelo Mental** | De abajo hacia arriba (átomos) | De arriba hacia abajo (eventos) |

### Veredicto

**Elige Jotai si:**
- Prefieres estado distribuido, basado en átomos
- Estás construyendo una app Suspense-first
- Quieres código repetitivo mínimo
- El estado es mayormente con alcance de componente

**Elige Quo.js si:**
- Prefieres estado centralizado
- Necesitas arquitectura impulsada por eventos
- Quieres middleware/efectos para preocupaciones transversales
- La coordinación de estado entre funcionalidades es crítica

---

## MobX

### Modelo Conceptual

**MobX** usa programación reactiva con observables. Los cambios de estado activan automáticamente actualizaciones mediante proxies.

```typescript
// Enfoque MobX
class TodoStore {
 @observable todos = [];
 
 @action
 addTodo(todo) {
  this.todos.push(todo); // MobX rastrea esta mutación
 }
 
 @computed
 get completedCount() {
  return this.todos.filter(t => t.completed).length;
 }
}

// Uso
const store = new TodoStore();
const App = observer(() => {
 return <div>{store.completedCount}</div>; // Auto-actualiza
});
```

**Arquitectura:**
- Estado observable (proxies)
- Rastreo automático de dependencias
- Actualizaciones mutables (rastreadas mediante proxies)
- Basado en clases o funcional
- Grano fino por defecto

### Cuándo MobX Sobresale

✅ **Reactividad implícita** 
MobX rastrea automáticamente dependencias. Sin suscripciones manuales.

✅ **Actualizaciones de estilo mutable** 
Se siente como JavaScript plano. No necesita patrones inmutables.

✅ **Grano fino por defecto** 
Los componentes solo se re-renderizan cuando sus observables específicos cambian.

✅ **Amigable con OOP** 
Ajuste natural para arquitecturas basadas en clases.

### Cuándo Quo.js Sobresale

✅ **Flujo de eventos explícito** 
Los eventos de Quo.js son rastreables. La reactividad de MobX es "mágica" (más difícil de depurar).

✅ **Garantías de inmutabilidad** 
Quo.js fuerza actualizaciones inmutables. MobX permite mutación (propenso a errores).

✅ **Depuración de viaje en el tiempo** 
Los eventos de Quo.js crean un historial reproducible. Las mutaciones de MobX son más difíciles de rastrear.

✅ **Pipeline asíncrono** 
Quo.js tiene un flujo asíncrono estructurado. MobX requiere gestión manual de `runInAction`.

**Ejemplo:**
```typescript
// MobX: Manejo asíncrono manual
class Store {
 @observable loading = false;
 @observable data = null;
 
 @action
 async fetchData() {
  this.loading = true; // Debe envolver en action
  const res = await fetch('/api/data');
  runInAction(() => { // Debe envolver continuación asíncrona
   this.data = await res.json();
   this.loading = false;
  });
 }
}

// Quo.js: Pipeline asíncrono incorporado
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

### Comparación de Rendimiento

| Métrica | MobX | Quo.js |
|--------|------|--------|
| **Granularidad de Suscripción** | Nivel de observable (fino) | Nivel de ruta (fino) |
| **Frecuencia de Re-renderizado** | Mínima | Mínima |
| **Tamaño de Bundle** | ~16KB | ~15KB |
| **Curva de Aprendizaje** | Moderada (modelo de reactividad) | Moderada (modelo de eventos) |
| **Depuración** | Más difícil (implícito) | Más fácil (eventos explícitos) |

### Veredicto

**Elige MobX si:**
- Prefieres programación reactiva
- Te gustan actualizaciones de estilo mutable
- Estás construyendo una app con mucho OOP
- Quieres código repetitivo mínimo

**Elige Quo.js si:**
- Prefieres flujo de eventos explícito
- Quieres garantías de inmutabilidad
- Necesitas depuración de viaje en el tiempo
- Quieres patrones asíncronos estructurados

---

## XState

### Modelo Conceptual

**XState** modela el estado como máquinas de estados finitos (FSM). Las transiciones de estado son explícitas y gobernadas por definiciones de máquina.

```typescript
// Enfoque XState
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

**Arquitectura:**
- Máquinas de estados
- Transiciones de estado explícitas
- Modelo de actor (buzones para mensajes)
- Diagramas visuales
- Orquestación asíncrona compleja

### Cuándo XState Sobresale

✅ **Máquinas de estados complejas** 
XState sobresale cuando las transiciones de estado son numerosas y condicionales (ej., flujos de checkout, formularios de múltiples pasos).

✅ **Modelado visual** 
Las máquinas XState pueden visualizarse como diagramas, siendo excelente documentación.

✅ **Prevención de estados imposibles** 
XState hace imposibles las transiciones de estado inválidas por diseño.

✅ **Modelo de actor** 
Genial para coordinar múltiples procesos concurrentes.

### Cuándo Quo.js Sobresale

✅ **Modelo mental más simple** 
El enfoque impulsado por eventos de Quo.js es más fácil de entender para apps típicas. Las FSM de XState tienen una curva de aprendizaje empinada.

✅ **Estado de propósito general** 
Quo.js es mejor para apps CRUD donde el estado no es estrictamente una "máquina". XState es excesivo para gestión de datos simple.

✅ **Menos código repetitivo** 
Las máquinas XState son verbosas. Los eventos y reducers de Quo.js son más concisos.

**Ejemplo:**
```typescript
// XState: Definición de máquina verbosa
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

### Comparación de Rendimiento

| Métrica | XState | Quo.js |
|--------|--------|--------|
| **Ajuste de Caso de Uso** | Flujos de trabajo complejos | Gestión de estado general |
| **Tamaño de Bundle** | ~30KB | ~15KB |
| **Curva de Aprendizaje** | Empinada (conceptos FSM) | Moderada (modelo de eventos) |
| **Código Repetitivo** | Alto (definiciones de máquina) | Bajo (reducers) |
| **Visualización** | Excelente (diagramas) | Ninguna (solo eventos) |

### Veredicto

**Elige XState si:**
- Estás modelando flujos de trabajo complejos (checkout, wizards, juegos)
- Necesitas diagramas de estado visuales
- Quieres eliminar estados imposibles
- Te sientes cómodo con conceptos de máquina de estados

**Elige Quo.js si:**
- Estás construyendo apps CRUD típicas
- Quieres un modelo mental más simple
- Necesitas gestión de estado de propósito general
- Quieres menos código repetitivo

---

## Tabla Resumen

| Característica | Redux Toolkit | Zustand | Jotai | MobX | XState | Quo.js |
|---------|---------------|---------|-------|------|--------|--------|
| **Arquitectura** | Centralizada | Centralizada | Distribuida | Observable | FSM | Centralizada + Eventos |
| **Soporte Asíncrono** | Thunks/RTK Query | Manual | Manual | `runInAction` | Incorporado | Incorporado |
| **Suscripciones** | Nivel de slice | Nivel de selector | Nivel de átomo | Nivel de observable | Nivel de estado | Nivel de ruta |
| **Tamaño de Bundle** | ~45KB | ~1KB | ~3KB | ~16KB | ~30KB | ~15KB |
| **Curva de Aprendizaje** | Moderada | Baja | Baja-Moderada | Moderada | Empinada | Moderada |
| **Código Repetitivo** | Medio | Mínimo | Mínimo | Mínimo | Alto | Bajo-Medio |
| **DevTools** | Excelente | Bueno | Bueno | Bueno | Excelente | Bueno |
| **TypeScript** | Excelente | Bueno | Excelente | Bueno | Excelente | Excelente |
| **Inmutabilidad** | Forzada (Immer) | Manual | Forzada | Opcional (proxies) | Forzada | Forzada |
| **Ordenamiento de Eventos** | Sync | Ninguno | Ninguno | Ninguno | Explícito | Cola FIFO |
| **Soporte Node.js** | Sí | No | No | Sí | Sí | Sí |

---

## Matriz de Decisión

### Elige Quo.js si necesitas:

✅ **Rendimiento de grano fino** sin optimización manual 
✅ **Soporte asíncrono nativo** sin bibliotecas externas 
✅ **Arquitectura impulsada por eventos** con garantías de ordenamiento 
✅ **Runtime universal** (web + Node.js + Deno + Bun) 
✅ **Eventos explícitos y rastreables** para depuración 
✅ **Organización basada en canales** para apps grandes 

### Elige Redux Toolkit si necesitas:

✅ Ecosistema maduro con extensas herramientas 
✅ RTK Query para obtención de datos 
✅ Familiaridad del equipo con patrones Redux 
✅ Depuración de viaje en el tiempo con Redux DevTools 

### Elige Zustand si necesitas:

✅ Tamaño de bundle mínimo (<5KB total) 
✅ API simple con cero código repetitivo 
✅ Adopción gradual en apps existentes 

### Elige Jotai si necesitas:

✅ Estado distribuido basado en átomos 
✅ Arquitectura Suspense-first 
✅ Composición de estado de abajo hacia arriba 

### Elige MobX si necesitas:

✅ Modelo de programación reactiva 
✅ Actualizaciones de estilo mutable 
✅ Arquitectura basada en clases 

### Elige XState si necesitas:

✅ Máquinas de estados finitos 
✅ Modelado de flujos de trabajo complejos 
✅ Diagramas de estado visuales 

---

## Conclusión

Quo.js ocupa una posición única en el panorama de gestión de estado:

- **Más estructurado que Zustand** (eventos + canales vs. actualizaciones directas)
- **Más performante que Redux** (suscripciones atómicas por defecto)
- **Más explícito que Jotai** (store centralizado vs. átomos distribuidos)
- **Más depurable que MobX** (eventos explícitos vs. reactividad implícita)
- **Más accesible que XState** (propósito general vs. máquinas de estado)

Si valoras **flujo de eventos explícito**, **rendimiento de grano fino**, **soporte asíncrono nativo** y **compatibilidad de runtime universal**, Quo.js vale la pena evaluar.

---

**Lectura Adicional:**
- [Arquitectura de Cola de Eventos](./event-queue-architecture.md) - Inmersión técnica profunda en la cola asíncrona de Quo.js
- [Guía de Inicio Rápido](https://quojs.dev) - Comienza en 5 minutos
- [Referencia de API](https://github.com/quojs/quojs/blob/main/packages/core/docs/README.md) - Documentación TypeDoc completa

---

**Historial de Revisiones**

| Versión | Fecha | Cambios |
|---------|------|---------|
| 0.5.0 | 2026-01 | Comparación integral inicial |

---

**Licencia:** MIT 
**Repositorio:** https://github.com/quojs/quo 
**Sitio Web:** https://quojs.dev