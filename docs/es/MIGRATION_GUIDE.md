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
      events: [["counter", "increment"], ["counter", "reset"]],
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

### Thunks / RTK Query → effects

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
      events: [["counter", "increment"], ["counter", "reset"]],
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
- [API de @yoltra/core](../../packages/core/README.es.md) · [API de @yoltra/react](../../packages/react/README.es.md)
- [Comparación de Librerías](./design/state-management-library-comparison.md) — las compensaciones arquitectónicas honestas
