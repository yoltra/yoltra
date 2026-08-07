![Yoltra logo](../../assets/yoltra-logo.png)

# Guía de Migración

> [🇺🇸 English](../en/MIGRATION_GUIDE.md) &nbsp;|&nbsp; 👉 Español

¿Vienes de Redux, Zustand o Jotai? Esta guía mapea los conceptos que ya conoces
a Yoltra y muestra el antes/después de cada uno.

---

## El único cambio de mentalidad

Yoltra es **event-sourced**. No haces `set` del estado directamente — **emites un
evento** `(channel, type, payload)`, y un **reducer puro** calcula el siguiente
estado. Las lecturas son **suscripciones a rutas de grano fino**: un componente
se re-renderiza solo cuando cambia la hoja exacta que lee. El trabajo asíncrono
vive en los **effects**.

```tsx
emit("todos", "add", { title: "Comprar leche" }); // 1. emite un evento
// 2. un reducer calcula el siguiente estado (de forma síncrona)
const title = useAtomicProp({ reducer: "todos", property: "items.0.title" }); // 3. lee una ruta
```

Ese es todo el modelo. Todo lo de abajo es una traducción de tu librería actual
a esos tres movimientos.

---

## Mapa de conceptos

| Concepto             | Redux / RTK              | Zustand              | Jotai                | Yoltra                                   |
| -------------------- | ------------------------ | -------------------- | -------------------- | ---------------------------------------- |
| Definir estado       | `createSlice`            | `create(set => …)`   | `atom(inicial)`      | slice de reducer en `createYoltra`       |
| Cambiar estado       | `dispatch(action)`       | `set(...)`           | `set(atom, v)`       | `emit(channel, type, payload)`           |
| Lógica de update     | reducer (switch)         | inline en `set`      | write atom           | reducer (puro `(state, event) => next`)  |
| Leer estado          | `useSelector`            | `useStore(sel)`      | `useAtomVal(atom)`   | `useAtomicProp` (grano fino)             |
| Valor derivado       | `reselect`               | selector fn          | `atom` derivado      | `useAtomicProps(specs, selector)`        |
| Async / efectos      | thunk / RTK Query / saga | dentro de acciones   | `atomWith...`        | **effect** (`effects: [...]`)            |
| Interceptar / guard  | middleware               | (manual)             | (manual)             | **middleware** (síncrono, puede rechazar)|
| Provider             | requerido                | no necesario         | requerido            | opcional (los hooks usan el store)       |

---

## Desde Redux / Redux Toolkit

**Mapeo:** `action → event`, `dispatch → emit`, `slice reducer → reducer`,
`useSelector → useAtomicProp`, `thunk / RTK Query → effect`,
`middleware → middleware (síncrono) o effect (async)`.

### Store + slice

```ts
// Redux Toolkit
const counter = createSlice({
  name: "counter",
  initialState: { value: 0 },
  reducers: {
    increment: (s, a: PayloadAction<number>) => { s.value += a.payload; },
    reset: (s) => { s.value = 0; },
  },
});
export const store = configureStore({ reducer: { counter: counter.reducer } });
```

```ts
// Yoltra
import { createYoltra } from "@yoltra/react";

export type AppEM = { counter: { increment: number; reset: null } };

export const { useAtomicProp, useEmit } = createYoltra({
  name: "App",
  reducer: {
    counter: {
      state: { value: 0 },
      when: { keys: [["counter", "increment"], ["counter", "reset"]] },
      reducer: (s, e) => {
        switch (e.type) {
          case "increment": return { value: s.value + e.payload };
          case "reset":     return { value: 0 };
          default:          return s;
        }
      },
    },
  },
});
```

### Dispatch → emit, useSelector → useAtomicProp

```tsx
// Redux
const value = useSelector((s: RootState) => s.counter.value);
const dispatch = useDispatch();
dispatch(increment(1));
```

```tsx
// Yoltra — se re-renderiza solo cuando counter.value cambia; sin memo, sin reselect
const value = useAtomicProp({ reducer: "counter", property: "value" });
const emit = useEmit();
emit("counter", "increment", 1);
```

### Thunks → effects

El trabajo asíncrono va en los **effects**, que corren después del reducer y
pueden emitir eventos de seguimiento (tus acciones de éxito/fallo):

```ts
// Thunk de Redux
const fetchTodos = () => async (dispatch) => {
  dispatch(loading());
  const res = await api.getTodos();
  dispatch(loaded(res));
};
```

```ts
// Effect de Yoltra
effects: [
  {
    when: { keys: [["todos", "fetch"]] },
    effect: async (event, getState, emit) => {
      const res = await api.getTodos();
      await emit("todos", "loaded", res); // reduce el resultado como cualquier evento
    },
  },
],
```

### RTK Query → nada, y esa es la respuesta honesta

No hay equivalente, porque Yoltra es un contenedor de estado y RTK Query es una capa de fetching
de datos. Te da caché de peticiones, deduplicación, invalidación por tags, refetch al recuperar
el foco o la conexión, polling, updates optimistas y hooks generados. Nada de eso es gestión de
estado, y reconstruirlo sobre effects es un proyecto, no una migración.

**Lo normal es quedártelo.** RTK Query necesita un store de Redux, así que conservarlo significa
conservar ese store — lo cual está bien, y es justo de lo que trata la sección de abajo sobre
adoptar Yoltra de forma incremental. Los datos del servidor se quedan donde están; el estado que
es genuinamente tuyo se mueve.

Si prefieres no quedarte con Redux, [TanStack Query](https://tanstack.com/query) hace el mismo
trabajo sin él, y compone con Yoltra igual: él es dueño de la caché del servidor, Yoltra de todo
lo demás.

Construirlo tú mismo es la última opción a la que recurrir. Las piezas están aquí — los effects
hacen el fetch, `createEntityAdapter` te da una caché normalizada, y la ventana de dedup colapsa
emisiones duplicadas — pero la deduplicación de peticiones, la invalidación de caché y la
política de refetch son la parte difícil, y lo son en cualquier sitio donde las escribas:

```ts
const articles = createEntityAdapter<Article>();

effects: [
  {
    when: { keys: [["articles", "requested"]] },
    effect: async (event, getState, emit) => {
      // ¿Ya lo tenemos, y suficientemente fresco? Entonces esto no hace nada.
      if (articles.selectById(getState().articles, event.payload.id) !== undefined) return;
      await emit("articles", "loaded", await api.getArticle(event.payload.id));
    },
  },
],
```

Eso es una caché. No es invalidación, y no es una política de refetch. Escribe esas dos solo si
sabes que las quieres.

### Middleware

El middleware de Redux envuelve `dispatch`. El de Yoltra es **síncrono** y
devuelve un booleano — devuelve `false` para **rechazar** un evento (se vuelve un
evento "uncommitted" al que tu UI puede reaccionar). El trabajo async del
middleware se mueve a los effects.

```ts
middleware: [
  {
    when: { channel: "admin" },
    middleware: (state, event) => state.auth.isAdmin, // false → rechazado
  },
],
```

---

## Desde Zustand

**Mapeo:** `create(set => …) → createYoltra`, `set(...) → emit + reducer`,
`useStore(selector) → useAtomicProp`.

```ts
// Zustand
const useStore = create((set) => ({
  value: 0,
  increment: (n) => set((s) => ({ value: s.value + n })),
  reset: () => set({ value: 0 }),
}));
```

```ts
// Yoltra — estado y transiciones separados: emite un evento, redúcelo
export const { useAtomicProp, useEmit } = createYoltra({
  name: "App",
  reducer: {
    counter: {
      state: { value: 0 },
      when: { keys: [["counter", "increment"], ["counter", "reset"]] },
      reducer: (s, e) =>
        e.type === "increment" ? { value: s.value + e.payload }
        : e.type === "reset"   ? { value: 0 }
        : s,
    },
  },
});
```

```tsx
// Zustand: const value = useStore((s) => s.value); useStore.getState().increment(1);
// Yoltra:
const value = useAtomicProp({ reducer: "counter", property: "value" });
const emit = useEmit();
emit("counter", "increment", 1);
```

**¿Por qué el paso extra?** La separación acción/reducer es lo que te da el log
de eventos, el time-travel y los DevTools — el `set` inline de Zustand no se
puede reproducir ni inspeccionar. A cambio obtienes lecturas de grano fino
gratis: `useAtomicProp` se re-renderiza por una hoja, sin ajustar igualdad de
selectores.

---

## Desde Jotai

**Mapeo:** un `atom` ≈ una **ruta** en un slice; `useAtomValue → useAtomicProp`;
átomos derivados → `useAtomicProps(specs, selector)`; `useSetAtom → useEmit`.

```ts
// Jotai
const countAtom = atom(0);
const doubledAtom = atom((get) => get(countAtom) * 2);
```

```tsx
// Lecturas/escrituras en Jotai
const count = useAtomValue(countAtom);
const doubled = useAtomValue(doubledAtom);
const setCount = useSetAtom(countAtom);
setCount((c) => c + 1);
```

```tsx
// Yoltra — un slice, las rutas son tus "átomos", las derivaciones son selectores
const count = useAtomicProp({ reducer: "counter", property: "value" });
const doubled = useAtomicProp({ reducer: "counter", property: "value" }, (v) => v * 2);

const emit = useEmit();
emit("counter", "increment", 1);
```

Para un valor derivado de **varias** rutas, usa `useAtomicProps` — se recalcula
solo cuando una de las rutas listadas cambia:

```tsx
const filtered = useAtomicProps(
  [
    { reducer: "todos", property: "items.**" },
    { reducer: "filter", property: "q" },
  ],
  (s) => s.todos.items.filter((t) => t.title.includes(s.filter.q)),
  shallowEqual,
);
```

Jotai da reactividad de grano fino de abajo hacia arriba (muchos átomos); Yoltra
da lo mismo de arriba hacia abajo (rutas en slices) **más** un log de eventos y
DevTools con time-travel que el modelo de átomos no tiene.

---

## Adoptarlo junto a lo que ya tienes

No tienes que elegir. Dos stores pueden convivir en la misma aplicación sin saber el uno del
otro, y así es como una migración se hace a plena luz en vez de en una rama enorme.

El [ejemplo `yoltra-in-react`](../../examples/v0/yoltra-in-react) está construido exactamente
así: la misma aplicación de todos implementada dos veces, `src/state/redux` junto a
`src/state/yoltra` y `src/components/redux` junto a `src/components/yoltra`, corriendo lado a
lado en una sola página. Existe para comparar ambas, pero la disposición es la misma que usa una
adopción incremental.

**Elige un slice acotado y muévelo entero.** Una funcionalidad cuyo estado nadie más lee — un
panel de filtros, un asistente, un cajón de ajustes — es un buen primer movimiento. Medio slice
en cada librería es la única disposición que hay que evitar: dos dueños del mismo valor
significa que ambos discrepan, y cuál tiene razón depende de cuál renderizó último.

```tsx
// Redux conserva lo que ya es suyo.
<Provider store={reduxStore}>
  <App>
    <LegacyDashboard />         {/* useSelector, dispatch */}
    <StoreProvider store={yoltraStore}>
      <NewSettingsPanel />      {/* useAtomicProp, useEmit */}
    </StoreProvider>
  </App>
</Provider>
```

**Mejor sin puente.** Si los slices son realmente disjuntos, los dos stores nunca necesitan
hablarse, y añadir un puente crea justo el acoplamiento que la separación buscaba evitar.

Cuando uno genuinamente deba reaccionar al otro, haz la dependencia unidireccional y ponla en un
effect:

```ts
// Yoltra se entera de algo que pertenece a Redux. En una sola dirección.
effects: [
  {
    when: { keys: [["session", "endedElsewhere"]] },
    effect: async (_event, _getState, emit) => {
      await emit("settings", "cleared", null);
    },
  },
],

// En algún punto del lado de Redux, una sola vez:
reduxStore.subscribe(() => {
  if (!selectIsAuthenticated(reduxStore.getState())) {
    void yoltraStore.emit("session", "endedElsewhere", null);
  }
});
```

Dos puentes apuntándose entre sí son un ciclo, y un ciclo entre dos stores es un bug que se
reproduce solo bajo un timing que no controlas. Si te descubres queriendo el segundo, mueve el
estado compartido a un único store.

---

## Persistencia: reemplazar redux-persist

`@yoltra/core` incluye `hydrate` y `persist`. La forma difiere de redux-persist en un punto que
conviene entender antes de portar nada.

**El store nace hidratado.** redux-persist rehidrata un store existente despachando una acción
`REHYDRATE`, así que cada reducer tiene que tolerar que su estado sea reemplazado por debajo y
la UI renderiza una vez con los valores por defecto antes de que lleguen los reales. Yoltra lee
el payload *primero* y lo usa como estado inicial de los reducers: no hay parpadeo, ni acción
sintética, ni una transición que los effects observen y que nunca ocurrió:

```ts
import {
  createStore, createWebStorageAdapter, hydrate, persist, withHydration,
} from "@yoltra/core";

const adapter = createWebStorageAdapter(localStorage);
const hydration = await hydrate({ key: "app", adapter, version: 3 });

const store = createStore({
  name: "App",
  reducer: withHydration({ todos: todosSpec, ui: uiSpec }, hydration),
});

// Persiste solo lo que vale la pena. Un cambio en un slice no vigilado no cuesta nada.
const stop = persist(store, { key: "app", adapter, version: 3, slices: ["todos"] });
```

| redux-persist | Yoltra |
| --- | --- |
| `persistReducer` envuelve cada reducer | `withHydration` aporta el estado inicial |
| `PersistGate` oculta la UI hasta rehidratar | nada que ocultar — el primer render ya está hidratado |
| `migrate` por número de versión | `migrate(persisted, fromVersion)`, misma idea |
| `whitelist` / `blacklist` | `slices: ["todos"]` |
| `transforms` | `serialize`, más el códec de abajo |
| motores de almacenamiento | `PersistenceAdapter`, tres incluidos |

**Una versión que no coincide se rechaza, no se acepta a ciegas.** Los reducers cambian, y un
snapshot escrito contra una forma anterior puede no ser estado válido para este build. Aporta
`migrate` para actualizarlo, o se descarta y arrancas desde tus valores por defecto.

**Nada lanza al arrancar.** Un payload ausente, ilegible o no migrable cae a esos valores por
defecto y lo reporta por `onError`. Un store que no arranca porque `localStorage` guarda JSON
viejo es peor que uno que arranca limpio, y un disco lleno no debería tumbar la página que está
persistiendo.

**`Map`, `Set`, `Date`, `BigInt` y las referencias cíclicas sobreviven el viaje de ida y
vuelta.** `JSON.stringify` no falla con un `Map`; lo convierte en `{}` en silencio, que es el
tipo de pérdida de datos que descubres meses después.

Para render en servidor, `dehydrate(store, { version })` produce el payload y
`hydrate({ source, version })` lo consume.

---

## Detalles y FAQ

- **"¿Dónde está `setState`?"** No existe, por diseño. Emite un evento; un reducer
  produce el siguiente estado. Esa indirección es lo que hace todo el historial
  inspeccionable y reproducible.
- **Los reducers deben ser puros.** Sin async, sin I/O, sin mutar el estado
  anterior — devuelve un valor nuevo. El async va en los effects.
- **`getState()` es correcto justo después de `emit()`.** La fase de reduce es
  síncrona. Usa `await emit(...)` solo cuando además quieras que *los effects de
  ese evento* hayan terminado.
- **¿Necesito un Provider?** No — los hooks de `createYoltra` usan el store que
  creó. Usa `<StoreProvider>` solo para acotar otra instancia a un subárbol (p.
  ej. un store nuevo por test).
- **¿Channels?** La dimensión extra `channel` da namespace a los eventos
  (`"auth"`/`"ui"`/`"todos"`) para que las apps grandes no colisionen en un
  espacio plano de tipos de acción. Elige channels por dominio.

---

## Siguientes pasos

- [Guía de Inicio Rápido](./QUICK_START_GUIDE.md) — de la instalación a una app funcionando en tres pasos
- [Guía de Testing](./TESTING_GUIDE.md) — prueba stores, effects y componentes
- [`yoltra-in-react`](../../examples/v0/yoltra-in-react) — la misma app en Redux y en Yoltra, lado a lado
- [API de @yoltra/core](../../packages/core/README.es.md) · [API de @yoltra/react](../../packages/react/README.es.md)
- [Comparación de Librerías](./design/state-management-library-comparison.md) — las compensaciones arquitectónicas honestas
