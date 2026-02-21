![Yoltra logo](../../../assets/yoltra-logo.png)

# Gestion de Estado: Comparacion Arquitectonica

> [ 🇲🇽 Versión en Español](https://github.com/yoltra/yoltra/blob/main/docs/es/design/state-management-library-comparison.md)&nbsp;
> | &nbsp; 👉
> [ 🇺🇸 English Version](https://github.com/yoltra/yoltra/blob/main/docs/en/design/state-management-library-comparison.md)&nbsp;

**Version:** 0.7.0 **Ultima actualizacion:** Febrero 2026

## Introduccion

Las bibliotecas de gestion de estado hacen diferentes **apuestas arquitectonicas**. Esas
apuestas determinan que problemas cada biblioteca resuelve de forma mas natural y donde genera
friccion. Este documento examina esas diferencias arquitectonicas honestamente -- no para
declarar un ganador, sino para ayudarte a elegir la herramienta correcta para tu problema
especifico.

Cada seccion describe el modelo central de una biblioteca, explica la clase de aplicaciones
donde ese modelo sobresale, y resalta como difiere del enfoque de Yoltra.

---

## Yoltra en Breve

Yoltra esta construido sobre tres apuestas arquitectonicas:

1. **Suscripciones a nivel de ruta** -- Los componentes se suscriben a rutas con notacion de
   puntos (`"items.0.title"`, `"items.*.done"`) y se re-renderizan solo cuando esa ruta exacta
   cambia.
2. **Pipeline de eventos estructurado** -- Los eventos fluyen a traves de un pipeline formal e
   interceptable: dedup -> middleware (puede rechazar) -> reducers -> suscriptores de eventos ->
   efectos -> suscriptores gruesos.
3. **Eventos tipados por canal** -- Los eventos son tuplas `(channel, type, payload)` en lugar
   de strings planos de accion.

```typescript
// Suscripcion por ruta: solo se re-renderiza cuando items[0].title cambia
const title = useAtomicProp({
  reducer: "todos",
  property: "items.0.title",
});

// Evento tipado por canal
await emit("todos", "toggle", { id: "123" });
```

**Donde esta arquitectura brilla:** Aplicaciones con muchos elementos de UI que se actualizan
independientemente (dashboards, editores colaborativos, grids de datos, sistemas de particulas),
aplicaciones que necesitan autorizacion/validacion de eventos en la capa de middleware, y
aplicaciones universales que comparten logica de estado entre cliente y servidor.

**Donde genera friccion:** Apps simples donde la granularidad a nivel de ruta es overhead
innecesario. Aplicaciones donde el tamano del bundle debe estar por debajo de 5KB. Proyectos
donde el equipo prefiere actualizaciones con estilo mutable o estado distribuido basado en
atomos.

---

## Redux Toolkit

### Arquitectura

Redux Toolkit (RTK) esta construido sobre **flujo de datos unidireccional con reducers sincronos
y puros**. El estado vive en un unico store. Las actualizaciones ocurren a traves de acciones
despachadas que son procesadas por reducers de slice. Immer proporciona actualizaciones
inmutables ergonomicas. La logica asincrona se maneja con thunks o RTK Query.

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

**Equipos grandes con patrones establecidos.** Redux es la solucion de gestion de estado mas
probada en batalla en React. Sus convenciones estrictas (acciones, reducers, selectores) crean
consistencia en bases de codigo grandes. RTK Query proporciona una solucion completa de
obtencion de datos con cache y re-obtencion automatica. El ecosistema de DevTools es
inigualable.

**Apps que necesitan middleware extenso.** El modelo de middleware de Redux es maduro y tiene
miles de soluciones comunitarias para logging, analiticas, persistencia y seguimiento de
errores.

### Diferencias arquitectonicas con Yoltra

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

Esta diferencia importa mas en UIs con muchos elementos que se actualizan independientemente. En
una lista de 100 items, un `useSelector` de Redux en cada fila se ejecuta 100 veces en cada
dispatch. Un `useAtomicProp` de Yoltra en cada fila se dispara solo para la fila especifica que
cambio.

**Modelo de eventos.** Las acciones de Redux son strings planos (`"todos/addTodo"`). Los eventos
de Yoltra son tuplas tipadas por canal (`('todos', 'add', payload)`). Ambos enfoques funcionan;
los canales proporcionan namespacing natural a escala, mientras que los strings planos se
integran mejor con Redux DevTools y el ecosistema de middleware.

**Modelo asincrono.** Redux separa los reducers sincronos de los thunks asincronos. El
middleware y los efectos de Yoltra son asincronos por defecto -- las operaciones asincronas son
parte del pipeline central en lugar de una capa separada.

---

## Zustand

### Arquitectura

Zustand esta construido sobre **mutacion directa de estado via una funcion `set()`**. El estado
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
compromiso arquitectonico.

**Adopcion gradual.** Zustand no requiere providers, contexto ni reestructuracion. Puedes
agregarlo a cualquier arbol de componentes incrementalmente.

### Diferencias arquitectonicas con Yoltra

**Explicitud vs. minimalismo.** Zustand optimiza para la menor cantidad de codigo para que el
estado funcione. Yoltra optimiza para transiciones de estado explicitas y rastreables via
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

**Ordenamiento de eventos.** Las llamadas `set()` de Zustand son inmediatas y sincronas.
Multiples llamadas `set()` de diferentes operaciones asincronas pueden intercalarse de forma
impredecible. La cola de eventos FIFO de Yoltra garantiza ordenamiento estricto -- los eventos
siempre se procesan en el orden en que fueron emitidos.

**Tamano del bundle.** Zustand pesa aproximadamente 1KB. Yoltra (`@yoltra/core` +
`@yoltra/react`) pesa aproximadamente 15KB. Si el tamano del bundle es la restriccion principal,
Zustand gana claramente.

---

## Jotai

### Arquitectura

Jotai usa **estado distribuido basado en atomos**. En lugar de un store central, el estado se
distribuye entre atomos independientes. Los atomos pueden derivar de otros atomos, formando un
grafo de dependencias. Los componentes se suscriben a atomos especificos y se re-renderizan solo
cuando esos atomos cambian.

```typescript
const countAtom = atom(0);
const todosAtom = atom([]);
const completedCountAtom = atom((get) => get(todosAtom).filter((t) => t.completed).length);

const [count, setCount] = useAtom(countAtom);
```

### Donde Jotai sobresale

**Estado de grano fino con alcance de componente.** El modelo de atomos de Jotai es
inherentemente granular. Cada atomo es una unidad independiente de estado, y los componentes
solo se re-renderizan cuando sus atomos especificos cambian. Esto hace que Jotai sea excelente
para UIs donde el estado se distribuye naturalmente (campos de formulario, toggles, widgets
independientes).

**Arquitectura Suspense-first.** Jotai fue disenado para React Suspense desde el principio. Los
atomos asincronos se integran naturalmente con boundaries `<Suspense>`.

**Estado derivado composable.** Los atomos que derivan de otros atomos crean un grafo reactivo.
Esto es poderoso para aplicaciones donde los valores computados dependen de multiples fuentes de
estado independientes.

### Diferencias arquitectonicas con Yoltra

**Centralizado vs. distribuido.** Yoltra mantiene un unico arbol de estado al que te suscribes
en rutas especificas. Jotai distribuye el estado entre atomos independientes. Ambos logran
reactividad de grano fino, pero a traves de arquitecturas opuestas.

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

**Rastreabilidad de eventos.** Las actualizaciones de atomos en Jotai son implicitas -- llamas a
`setCount(count + 1)` y el estado cambia. No hay log de eventos, no hay punto de intercepcion de
middleware, no hay pista de auditoria. Los eventos de Yoltra son explicitos y rastreables a
traves de todo el pipeline. Esto importa cuando necesitas verificaciones de autorizacion,
undo/redo o analiticas sobre transiciones de estado.

**Middleware y preocupaciones transversales.** Jotai maneja preocupaciones transversales
(logging, persistencia, validacion) via middleware de atomos o atomos wrapper -- configuracion
por atomo. Yoltra las maneja centralmente via el pipeline de eventos -- una sola funcion de
middleware puede interceptar todos los eventos.

---

## MobX

### Arquitectura

MobX usa **estado observable con seguimiento automatico de dependencias**. El estado se envuelve
en proxies que rastrean que propiedades lee cada componente. Cuando una propiedad observable
cambia, solo los componentes que la leyeron se re-renderizan. Las actualizaciones tienen estilo
mutable -- modificas el estado directamente, y MobX rastrea la mutacion.

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

**Reactividad implicita con boilerplate minimo.** MobX rastrea automaticamente que propiedades
lee un componente y se re-renderiza solo cuando esas propiedades cambian. No escribes
selectores, suscripciones ni comparaciones de igualdad -- simplemente funciona. Esto es poderoso
para desarrolladores que quieren reactividad de grano fino sin pensar en ello.

**Aplicaciones amigables con OOP.** Los stores de MobX basados en clases con decoradores encajan
naturalmente en arquitecturas orientadas a objetos. Si tu equipo piensa en clases, propiedades
computadas y estado encapsulado, MobX se siente nativo.

**Actualizaciones con estilo mutable.** MobX te permite escribir `this.todos.push(todo)` en
lugar de `{ ...state, todos: [...state.todos, todo] }`. Para actualizaciones anidadas complejas,
esto es significativamente mas legible.

### Diferencias arquitectonicas con Yoltra

**Implicito vs. explicito.** MobX rastrea dependencias automaticamente via proxies -- los
componentes se re-renderizan "magicamente" cuando los observables que leyeron cambian. Yoltra
requiere suscripciones explicitas por ruta -- declaras lo que observas. MobX es mas facil de
usar; Yoltra es mas facil de depurar cuando algo sale mal.

**Mutabilidad.** MobX permite (y fomenta) la mutacion directa de objetos de estado. Yoltra
aplica inmutabilidad -- el estado se congela profundamente en desarrollo. Ambos enfoques tienen
tradeoffs: la mutacion es ergonomica pero puede causar bugs sutiles cuando las referencias se
comparten; la inmutabilidad es mas segura pero requiere mas ceremonia para actualizaciones
anidadas.

**Flujo de eventos.** MobX no tiene concepto de eventos o acciones como entidades de primera
clase (decorar con `@action` es para batching, no para crear una pista de eventos). Los eventos
de Yoltra fluyen a traves de un pipeline formal con middleware, efectos y fases
committed/uncommitted. Si necesitas interceptar, validar o auditar cambios de estado, Yoltra
proporciona la infraestructura; MobX requiere construirla tu mismo.

---

## XState

### Arquitectura

XState modela el estado como **maquinas de estados finitos y statecharts**. Las transiciones de
estado son explicitas y gobernadas por definiciones de maquina. Cada estado posible y transicion
se declara por adelantado. El modelo de actor habilita maquinas de estado concurrentes y
aisladas que se comunican via mensajes.

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

**Flujos de trabajo complejos y con estado.** XState esta disenado especificamente para procesos
con muchos estados y transiciones condicionales -- flujos de checkout, formularios multi-paso,
logica de juegos, implementaciones de protocolos. La definicion de maquina garantiza que las
transiciones de estado invalidas sean imposibles.

**Modelado visual y documentacion.** Las maquinas de XState pueden visualizarse como diagramas,
lo que las convierte en excelente documentacion viva. El editor visual Stately permite a
ingenieros y no ingenieros entender y validar la logica de estado.

**Concurrencia basada en actores.** El modelo de actores de XState es computacion concurrente
genuina -- multiples maquinas ejecutandose independientemente, comunicandose via mensajes. Esto
es poderoso para aplicaciones con procesos paralelos e independientes.

### Diferencias arquitectonicas con Yoltra

**Alcance.** XState esta disenado para **orquestacion de flujos de trabajo** -- modelar procesos
que se mueven a traves de fases distintas. Yoltra esta disenado para **gestion de estado basada
en datos** -- gestionar estado de aplicacion al que muchos elementos de UI se suscriben.
Resuelven problemas diferentes y pueden coexistir en la misma aplicacion (XState para logica de
flujos de trabajo, Yoltra para estado de aplicacion).

**Boilerplate.** Las definiciones de maquina de XState son verbosas por diseno -- cada estado y
transicion es explicito. Esto es una caracteristica, no un defecto, para flujos de trabajo donde
la explicitud previene errores. Pero para gestion de estado CRUD general, esta ceremonia es
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
estado de la maquina y seleccionas de el. Las suscripciones por ruta de Yoltra son mas
granulares para gestion de estado de UI.

---

## Resumen Arquitectonico

Cada biblioteca optimiza para una dimension diferente:

| Biblioteca        | Optimiza para                                       | Tradeoff central                                           |
| ----------------- | --------------------------------------------------- | ---------------------------------------------------------- |
| **Redux Toolkit** | Madurez del ecosistema, convenciones de equipo      | Mas boilerplate y configuracion, suscripciones mas gruesas |
| **Zustand**       | Superficie de API minima, baja ceremonia            | Menos estructura para flujos asincronos complejos          |
| **Jotai**         | Atomos distribuidos y composables                   | Mas dificil coordinar estado global                        |
| **MobX**          | Reactividad implicita, ergonomia mutable            | Mas dificil rastrear y depurar cambios de estado           |
| **XState**        | Correccion de flujos de trabajo, estados imposibles | Verboso para gestion de datos general                      |
| **Yoltra**        | Suscripciones de grano fino, pipeline de eventos    | Mas configuracion que Zustand/Jotai, bundle mas grande     |

No hay una biblioteca universalmente "mejor". La eleccion correcta depende de lo que tu
aplicacion necesita mas:

- **Friccion minima y bundle pequeno?** Zustand o Jotai.
- **El equipo ya conoce Redux?** Redux Toolkit.
- **OOP reactivo con actualizaciones mutables?** MobX.
- **Modelado de flujos de trabajo complejos?** XState.
- **Suscripciones de grano fino por ruta, autorizacion de eventos o estado universal (cliente +
  servidor)?** Yoltra.

---

## Lectura Adicional

- **[Arquitectura de Cola de Eventos](./event-queue-architecture.md)** -- Como funciona el
  pipeline de eventos asincronos de Yoltra internamente
- **[Guia de Inicio Rapido](https://github.com/yoltra/yoltra/blob/main/docs/en/QUICK_START_GUIDE.md)**
  -- Cinco pasos hacia una app funcional
- **[API de @yoltra/core](https://github.com/yoltra/yoltra/blob/main/packages/core/README.md)**
  -- Store, middleware, efectos, matchers `When`
- **[API de @yoltra/react](https://github.com/yoltra/yoltra/blob/main/packages/react/README.md)**
  -- Hooks con suscripciones de grano fino

---

**Licencia:** MIT **Repositorio:** https://github.com/yoltra/yoltra
