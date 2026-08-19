![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

# Gestión de Estado: Comparación Arquitectónica

> [ 🇲🇽 Versión en Español](https://github.com/yoltra/yoltra/blob/main/docs/es/design/state-management-library-comparison.md)&nbsp;
> | &nbsp; 👉
> [ 🇺🇸 English Versión](https://github.com/yoltra/yoltra/blob/main/docs/en/design/state-management-library-comparison.md)&nbsp;

**Aplica a:** `@yoltra/core` 0.6.0 **Última actualización:** Agosto 2026

## Introducción

Las bibliotecas de gestión de estado hacen diferentes **apuestas arquitectónicas**. Esas
apuestas determinan que problemas cada biblioteca resuelve de forma más natural y donde genera
fricción. Este documento examina esas diferencias arquitectónicas honestamente -- no para
declarar un ganador, sino para ayudarte a elegir la herramienta correcta para tu problema
específico.

Cada sección describe el modelo central de una biblioteca, explica la clase de aplicaciones
donde ese modelo sobresale, y resalta cómo difiere del enfoque de Yoltra.

---

## Yoltra en Breve

Yoltra está construido sobre cuatro apuestas arquitectónicas:

1. **Suscripciones a nivel de ruta** -- Los componentes se suscriben a rutas con notación de
   puntos (`"items.0.title"`, `"items.*.done"`), vía un accessor tipado o un string, y se
   re-renderizan solo cuando esa ruta exacta cambia.
2. **Event sourcing con un pipeline estructurado** -- Los eventos fluyen a través de un pipeline
   formal e interceptable: middleware (puede rechazar) -> reducers -> suscriptores de eventos ->
   oyentes gruesos, todo **síncrono**, y después los efectos asíncronos. La deduplicación por
   contenido es opt-in.
3. **Eventos tipados por canal** -- Los eventos son tuplas `(channel, type, payload)` en lugar
   de strings planos de acción.
4. **DevTools con introspección de primera** -- El store expone una costura de instrumentación
   tipada, así que el viaje en el tiempo, la repetición de eventos y los parches precisos por
   evento son de primera clase, no algo agregado después.

```typescript
// Suscripcion por ruta: solo re-renderiza cuando items.0.title cambia
const title = useAtomicProp({ reducer: "todos", property: "items.0.title" });

// Evento tipado por canal
await emit("todos", "toggle", { id: "123" });
```

**Donde esta arquitectura brilla:** Aplicaciones con muchos elementos de UI que se actualizan
independientemente (dashboards, editores colaborativos, grids de datos, sistemas de particulas),
aplicaciones que necesitan autorización/validación de eventos en la capa de middleware, y
cualquier app donde importe la depurabilidad de los cambios de estado (un log de eventos con
viaje en el tiempo viene gratis).

**Donde genera fricción:** Apps simples donde la granularidad a nivel de ruta es overhead
innecesario. Aplicaciones donde el tamaño del bundle debe estar por debajo de 5KB. Proyectos
donde el equipo prefiere actualizaciones con estilo mutable o estado distribuido basado en
átomos.

---

## Redux Toolkit

### Arquitectura

Redux Toolkit (RTK) está construido sobre **flujo de datos unidireccional con reducers síncronos
y puros**. El estado vive en un único store. Las actualizaciones ocurren a través de acciones
despachadas que son procesadas por reducers de slice. Immer proporciona actualizaciones
inmutables ergonómicas. La lógica asíncrona se maneja con thunks o RTK Query.

```typescript
const todosSlice = createSlice({
  name: "todos",
  initialState: { items: [] },
  reducers: {
    addTodo: (state, action) => {
      state.items.push(action.payload); // Sintaxis de mutacion con Immer
    },
  },
});

dispatch(addTodo({ id: "1", title: "Buy milk" }));
```

### Donde Redux Toolkit sobresale

**Equipos grandes con patrones establecidos.** Redux es la solución de gestión de estado más
probada en batalla en React. Sus convenciones estrictas (acciones, reducers, selectores) crean
consistencia en bases de código grandes. RTK Query proporciona una solución completa de
obtención de datos con cache y re-obtención automática. Su ecosistema de DevTools es el más
maduro del espacio.

**Apps que necesitan middleware extenso.** El modelo de middleware de Redux es maduro y tiene
miles de soluciones comunitarias para logging, analíticas, persistencia y seguimiento de
errores.

### Diferencias arquitectónicas con Yoltra

**Granularidad de suscripciones.** Las suscripciones de Redux operan a nivel de store --
`useSelector` se ejecuta en cada dispatch y depende de igualdad por referencia para evitar
re-renders. Las suscripciones de Yoltra operan a nivel de ruta y solo se disparan cuando la ruta
suscrita realmente cambia.

```typescript
// Redux: el selector se ejecuta en CADA dispatch, evita re-render via equality check
const title = useSelector((state) => state.todos.items[0]?.title);

// Yoltra: la suscripcion solo se dispara cuando items.0.title cambia
const title = useAtomicProp({
  reducer: "todos",
  property: "items.0.title",
});
```

Esta diferencia importa más en UIs con muchos elementos que se actualizan independientemente. En
una lista de 100 items, un `useSelector` de Redux en cada fila se ejecuta 100 veces en cada
dispatch. Un `useAtomicProp` de Yoltra en cada fila se dispara solo para la fila específica que
cambio.

**Modelo de eventos.** Las acciones de Redux son strings planos (`"todos/addTodo"`). Los eventos
de Yoltra son tuplas tipadas por canal (`('todos', 'add', payload)`). Ambos enfoques funcionan;
los canales proporcionan namespacing natural a escala, mientras que los strings planos se
integran mejor con Redux DevTools y el ecosistema de middleware.

**Capas síncronas vs. asíncronas.** Ambos mantienen los reducers síncronos. Redux pone el
trabajo asíncrono en thunks / RTK Query. Yoltra mantiene el **middleware también síncrono** --
así `getState()` es correcto en el instante en que `emit()` retorna -- y pone el trabajo
asíncrono en los efectos: una división comparable, integrada en el pipeline central.

**DevTools.** Las devtools de Redux son las más maduras del ecosistema y una razón importante por
la que los equipos se quedan. Yoltra cierra la mayor parte de esa brecha desde otro ángulo: como
el store reporta las rutas hoja exactas que cambiaron en cada evento, sus devtools renderizan
parches RFC-6902 precisos, tiempos de reducción reales, un log de eventos con fases
confirmado/rechazado, y viaje en el tiempo + repetición de eventos -- conservando la reactividad
de grano fino y el setup de una sola llamada que a Redux le faltan.

---

## Zustand

### Arquitectura

Zustand está construido sobre **mutación directa de estado vía una función `set()`**. El estado
y las acciones coexisten en una sola llamada a `create()`. No hay acciones, no hay reducers, no
hay middleware -- solo funciones que llaman a `set()`. Las suscripciones usan funciones
selectoras.

```typescript
const useStore = create((set) => ({
  todos: [],
  addTodo: (todo) =>
    set((state) => ({
      todos: [...state.todos, todo],
    })),
}));

const todos = useStore((state) => state.todos);
```

### Donde Zustand sobresale

**Apps pequenas a medianas que valoran la simplicidad.** Zustand tiene la menor ceremonia de
cualquier biblioteca de estado. Pesa aproximadamente 1KB. Casi no hay curva de aprendizaje -- si
entiendes `useState`, entiendes Zustand. Es ideal para agregar estado compartido a una app sin
compromiso arquitectónico.

**Adopción gradual.** Zustand no requiere providers, contexto ni reestructuración. Puedes
agregarlo a cualquier arbol de componentes incrementalmente.

### Diferencias arquitectónicas con Yoltra

**Explicitud vs. minimalismo.** Zustand optimiza para la menor cantidad de código para que el
estado funcione. Yoltra optimiza para transiciones de estado explícitas y rastreables vía
eventos. Son valores fundamentalmente diferentes -- Zustand confia en que los desarrolladores
mantengan las cosas simples; Yoltra proporciona estructura que escala.

```typescript
// Zustand: actualizacion directa — minima pero implicita
set((state) => ({ count: state.count + 1 }));

// Yoltra: evento con nombre — mas ceremonia pero rastreable
await emit("counter", "increment", 1);
```

**Modelo de suscripciones.** Los selectores de Zustand son funciones que se ejecutan en cada
llamada a `set()`. Optimizar para actualizaciones de grano fino requiere funciones de igualdad
manuales. Las suscripciones por ruta de Yoltra son de grano fino por defecto.

```typescript
// Zustand: necesita igualdad personalizada para evitar re-renders innecesarios
const title = useStore(
  (state) => state.todos[0]?.title,
  (a, b) => a === b,
);

// Yoltra: grano fino por defecto
const title = useAtomicProp({
  reducer: "todos",
  property: "items.0.title",
});
```

**Ordenamiento de eventos.** Las llamadas `set()` de Zustand son inmediatas y síncronas.
Múltiples llamadas `set()` de diferentes operaciones asíncronas pueden intercalarse de forma
impredecible. La cola de eventos FIFO de Yoltra garantiza ordenamiento estricto -- los eventos
siempre se procesan en el orden en que fueron emitidos.

**Tamaño del bundle.** Zustand pesa aproximadamente 1KB. Yoltra (`@yoltra/core` +
`@yoltra/react`) pesa aproximadamente 15KB. Si el tamaño del bundle es la restricción principal,
Zustand gana claramente.

---

## Jotai

### Arquitectura

Jotai usa **estado distribuido basado en átomos**. En lugar de un store central, el estado se
distribuye entre átomos independientes. Los átomos pueden derivar de otros átomos, formando un
grafo de dependencias. Los componentes se suscriben a átomos específicos y se re-renderizan solo
cuando esos átomos cambian.

```typescript
const countAtom = atom(0);
const todosAtom = atom([]);
const completedCountAtom = atom((get) => get(todosAtom).filter((t) => t.completed).length);

const [count, setCount] = useAtom(countAtom);
```

### Donde Jotai sobresale

**Estado de grano fino con alcance de componente.** El modelo de átomos de Jotai es
inherentemente granular. Cada átomo es una unidad independiente de estado, y los componentes
solo se re-renderizan cuando sus átomos específicos cambian. Esto hace que Jotai sea excelente
para UIs donde el estado se distribuye naturalmente (campos de formulario, toggles, widgets
independientes).

**Arquitectura Suspense-first.** Jotai fue diseñado para React Suspense desde el principio. Los
átomos asíncronos se integran naturalmente con boundaries `<Suspense>`.

**Estado derivado composable.** Los átomos que derivan de otros átomos crean un grafo reactivo.
Esto es poderoso para aplicaciones donde los valores computados dependen de múltiples fuentes de
estado independientes.

### Diferencias arquitectónicas con Yoltra

**Centralizado vs. distribuido.** Yoltra mantiene un único arbol de estado al que te suscribes
en rutas específicas. Jotai distribuye el estado entre átomos independientes. Ambos logran
reactividad de grano fino, pero a través de arquitecturas opuestas.

El enfoque centralizado (Yoltra) facilita razonar sobre el estado global, coordinar
actualizaciones transversales y serializar/restaurar el estado completo de la app. El enfoque
distribuido (Jotai) facilita crear unidades de estado autocontenidas y reutilizables, y evita la
necesidad de un provider en casos simples.

```typescript
// Jotai: el estado esta distribuido entre atomos
const titleAtom = atom("");
const doneAtom = atom(false);

// Yoltra: el estado vive en un arbol, suscrito por ruta
const title = useAtomicProp({ reducer: "todos", property: "items.0.title" });
const done = useAtomicProp({ reducer: "todos", property: "items.0.done" });
```

**Rastreabilidad de eventos.** Las actualizaciones de átomos en Jotai son implícitas -- llamas a
`setCount(count + 1)` y el estado cambia. No hay log de eventos, no hay punto de intercepción de
middleware, no hay pista de auditoría. Los eventos de Yoltra son explícitos y rastreables a
través de todo el pipeline. Esto importa cuando necesitas verificaciones de autorización,
undo/redo o analíticas sobre transiciones de estado.

**Middleware y preocupaciones transversales.** Jotai maneja preocupaciones transversales
(logging, persistencia, validación) vía middleware de átomos o átomos wrapper -- configuración
por átomo. Yoltra las maneja centralmente vía el pipeline de eventos -- una sola función de
middleware puede interceptar todos los eventos.

---

## MobX

### Arquitectura

MobX usa **estado observable con seguimiento automático de dependencias**. El estado se envuelve
en proxies que rastrean que propiedades lee cada componente. Cuando una propiedad observable
cambia, solo los componentes que la leyeron se re-renderizan. Las actualizaciones tienen estilo
mutable -- modificas el estado directamente, y MobX rastrea la mutación.

```typescript
class TodoStore {
  @observable todos = [];

  @action
  addTodo(todo) {
    this.todos.push(todo); // MobX rastrea esta mutacion
  }

  @computed
  get completedCount() {
    return this.todos.filter(t => t.completed).length;
  }
}

const App = observer(() => {
  return <div>{store.completedCount}</div>; // Se auto-actualiza
});
```

### Donde MobX sobresale

**Reactividad implícita con boilerplate mínimo.** MobX rastrea automáticamente que propiedades
lee un componente y se re-renderiza solo cuando esas propiedades cambian. No escribes
selectores, suscripciones ni comparaciones de igualdad -- simplemente funciona. Esto es poderoso
para desarrolladores que quieren reactividad de grano fino sin pensar en ello.

**Aplicaciones amigables con OOP.** Los stores de MobX basados en clases con decoradores encajan
naturalmente en arquitecturas orientadas a objetos. Si tu equipo piensa en clases, propiedades
computadas y estado encapsulado, MobX se siente nativo.

**Actualizaciones con estilo mutable.** MobX te permite escribir `this.todos.push(todo)` en
lugar de `{ ...state, todos: [...state.todos, todo] }`. Para actualizaciones anidadas complejas,
esto es significativamente más legible.

### Diferencias arquitectónicas con Yoltra

**Implícito vs. explícito.** MobX rastrea dependencias automáticamente vía proxies -- los
componentes se re-renderizan "mágicamente" cuando los observables que leyeron cambian. Yoltra
requiere suscripciones explícitas por ruta -- declaras lo que observas. MobX es más fácil de
usar; Yoltra es más fácil de depurar cuando algo sale mal.

**Mutabilidad.** MobX permite (y fomenta) la mutación directa de objetos de estado. Yoltra
aplica inmutabilidad -- el estado se congela profundamente en desarrollo. Ambos enfoques tienen
tradeoffs: la mutación es ergonómica pero puede causar bugs sutiles cuando las referencias se
comparten; la inmutabilidad es más segura pero requiere más ceremonia para actualizaciones
anidadas.

**Flujo de eventos.** MobX no tiene concepto de eventos o acciones como entidades de primera
clase (decorar con `@action` es para batching, no para crear una pista de eventos). Los eventos
de Yoltra fluyen a través de un pipeline formal con middleware, efectos y fases
committed/uncommitted. Si necesitas interceptar, validar o auditar cambios de estado, Yoltra
proporciona la infraestructura; MobX requiere construirla tu mismo.

---

## XState

### Arquitectura

XState modela el estado como **máquinas de estados finitos y statecharts**. Las transiciones de
estado son explícitas y gobernadas por definiciones de máquina. Cada estado posible y transición
se declara por adelantado. El modelo de actor habilita máquinas de estado concurrentes y
aisladas que se comunican vía mensajes.

```typescript
const todoMachine = createMachine({
  id: "todo",
  initial: "idle",
  states: {
    idle: { on: { FETCH: "loading" } },
    loading: {
      invoke: {
        src: "fetchTodos",
        onDone: { target: "success", actions: "assignTodos" },
        onError: "failure",
      },
    },
    success: {
      /* ... */
    },
    failure: {
      /* ... */
    },
  },
});
```

### Donde XState sobresale

**Flujos de trabajo complejos y con estado.** XState está diseñado específicamente para procesos
con muchos estados y transiciones condicionales -- flujos de checkout, formularios multi-paso,
lógica de juegos, implementaciones de protocolos. La definición de máquina garantiza que las
transiciones de estado invalidas sean imposibles.

**Modelado visual y documentación.** Las máquinas de XState pueden visualizarse como diagramas,
lo que las convierte en excelente documentación viva. El editor visual Stately permite a
ingenieros y no ingenieros entender y validar la lógica de estado.

**Concurrencia basada en actores.** El modelo de actores de XState es computación concurrente
genuina -- múltiples máquinas ejecutandose independientemente, comunicandose vía mensajes. Esto
es poderoso para aplicaciones con procesos paralelos e independientes.

### Diferencias arquitectónicas con Yoltra

**Alcance.** XState está diseñado para **orquestación de flujos de trabajo** -- modelar procesos
que se mueven a través de fases distintas. Yoltra está diseñado para **gestión de estado basada
en datos** -- gestionar estado de aplicación al que muchos elementos de UI se suscriben.
Resuelven problemas diferentes y pueden coexistir en la misma aplicación (XState para lógica de
flujos de trabajo, Yoltra para estado de aplicación).

**Boilerplate.** Las definiciones de máquina de XState son verbosas por diseño -- cada estado y
transición es explícito. Esto es una característica, no un defecto, para flujos de trabajo donde
la explicitud previene errores. Pero para gestión de estado CRUD general, esta ceremonia es
overhead.

```typescript
// XState: maquina explicita para un contador
const machine = createMachine({
  id: "counter",
  initial: "active",
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

// Yoltra: reducer para un contador
const counterReducer = (state, event) => {
  switch (event.type) {
    case "increment":
      return { count: state.count + 1 };
    case "decrement":
      return { count: state.count - 1 };
    default:
      return state;
  }
};
```

**Modelo de suscripciones.** XState no tiene suscripciones a nivel de ruta -- te suscribes al
estado de la máquina y seleccionas de el. Las suscripciones por ruta de Yoltra son más
granulares para gestión de estado de UI.

---

## Resumen Arquitectónico

Cada biblioteca optimiza para una dimensión diferente:

| Biblioteca        | Optimiza para                                       | Tradeoff central                                           |
| ----------------- | --------------------------------------------------- | ---------------------------------------------------------- |
| **Redux Toolkit** | Madurez del ecosistema, convenciones de equipo      | Más boilerplate y configuración, suscripciones más gruesas |
| **Zustand**       | Superficie de API mínima, baja ceremonia            | Menos estructura para flujos asíncronos complejos          |
| **Jotai**         | Átomos distribuidos y composables                   | Más difícil coordinar estado global                        |
| **MobX**          | Reactividad implícita, ergonomía mutable            | Más difícil rastrear y depurar cambios de estado           |
| **XState**        | Corrección de flujos de trabajo, estados imposibles | Verboso para gestión de datos general                      |
| **Yoltra**        | Grano fino + log de eventos + viaje en el tiempo    | Bundle más grande que Zustand; modelo de eventos opinado   |

No hay una biblioteca universalmente "mejor". La elección correcta depende de lo que tu
aplicación necesita más:

- **Fricción mínima y bundle pequeño?** Zustand o Jotai.
- **El equipo ya conoce Redux?** Redux Toolkit.
- **OOP reactivo con actualizaciones mutables?** MobX.
- **Modelado de flujos de trabajo complejos?** XState.
- **Reactividad de grano fino _y_ un log de eventos con devtools de viaje en el tiempo real, sin
  el boilerplate de Redux?** Yoltra.

---

## Lectura Adicional

- **[Arquitectura del Pipeline de Eventos](./event-queue-architecture.md)** -- Como funciona el
  pipeline de reducción síncrona / efectos asíncronos de Yoltra internamente
- **[Guia de Inicio Rápido](https://github.com/yoltra/yoltra/blob/main/docs/en/QUICK_START_GUIDE.md)**
  -- Cinco pasos hacia una app funcional
- **[API de @yoltra/core](https://github.com/yoltra/yoltra/blob/main/packages/core/README.md)**
  -- Store, middleware, efectos, matchers `When`
- **[API de @yoltra/react](https://github.com/yoltra/yoltra/blob/main/packages/react/README.md)**
  -- Hooks con suscripciones de grano fino

---

**Licencia:** MIT **Repositorio:** https://github.com/yoltra/yoltra
