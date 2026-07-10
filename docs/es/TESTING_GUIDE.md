![Yoltra logo](../../assets/yoltra-logo.png)

# Guía de Testing

> [🇺🇸 English](../en/TESTING_GUIDE.md) &nbsp;|&nbsp; 👉 Español

Yoltra es inusualmente fácil de probar: los reducers son **puros**, la fase de
reduce es **síncrona** (así que `getState()` es correcto en el instante en que
`emit()` retorna), y el store corre con **cero dependencias de framework** — la
mayor parte de tu lógica se prueba sin React. Los ejemplos usan
[Vitest](https://vitest.dev), pero Jest funciona igual.

---

## Probar el store (sin React)

Crea un store nuevo por test, emite eventos y valida con `getState()`.

```ts
import { afterEach, describe, expect, it } from "vitest";
import { createStore } from "@yoltra/core";

type AppEM = { counter: { increment: number; reset: null } };

function makeStore() {
  return createStore({
    name: "test",
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
}

describe("counter", () => {
  let store: ReturnType<typeof makeStore>;
  afterEach(() => store?.dispose()); // libera timers/recursos

  it("reduce increment de forma síncrona", () => {
    store = makeStore();
    store.emit("counter", "increment", 5);
    // Sin await — la fase de reduce es síncrona.
    expect(store.getState().counter.value).toBe(5);
  });

  it("resetea", () => {
    store = makeStore();
    store.emit("counter", "increment", 3);
    store.emit("counter", "reset", null);
    expect(store.getState().counter.value).toBe(0);
  });
});
```

Una fábrica `makeStore()` mantiene cada test aislado y sirve también como el
store que pasas a los tests de componentes de abajo.

---

## Probar reducers como funciones puras

Como un reducer es solo `(state, event) => nextState`, puedes probarlo sin store:

```ts
const reducer = counterSpec.reducer;
expect(reducer({ value: 0 }, { type: "increment", payload: 2, channel: "counter" } as any))
  .toEqual({ value: 2 });
```

Prefiere el test a nivel de store cuando quieras el tipado real de eventos; baja
a la función cruda para cobertura exhaustiva de ramas.

---

## Probar effects (async)

Los effects son la capa asíncrona. Mockea el I/O, emite el disparador y haz
`await` del `emit` — la promesa resuelve cuando *los effects de ese evento*
terminan.

```ts
import { vi } from "vitest";

it("carga todos y reduce el resultado", async () => {
  const api = { getTodos: vi.fn().mockResolvedValue([{ id: 1, title: "a" }]) };

  const store = createStore({
    name: "test",
    reducer: {
      todos: {
        state: { items: [] as { id: number; title: string }[] },
        events: [["todos", "loaded"]],
        reducer: (s, e) => (e.type === "loaded" ? { items: e.payload } : s),
      },
    },
    effects: [
      {
        when: { keys: [["todos", "fetch"]] },
        effect: async (_e, _get, emit) => emit("todos", "loaded", await api.getTodos()),
      },
    ],
  });

  await store.emit("todos", "fetch", null); // resuelve tras completar el effect
  expect(api.getTodos).toHaveBeenCalledOnce();
  expect(store.getState().todos.items).toHaveLength(1);
});
```

Prueba la ruta de **fallo** igual — haz que el effect emita un evento
`loadFailure` y valida el estado de error reducido.

---

## Probar middleware (rechazo)

El middleware es síncrono y devuelve un booleano. Un `false` rechaza el evento
(el estado no cambia) y produce un evento **uncommitted**, que puedes observar
con `onEvent(..., "uncommitted")`.

```ts
it("rechaza boost por debajo del umbral de batería", () => {
  const store = createStore({
    name: "test",
    reducer: {
      sat: {
        state: { battery: 10, boosting: false },
        events: [["command", "boost"]],
        reducer: (s, e) => (e.type === "boost" ? { ...s, boosting: true } : s),
      },
    },
    middleware: [
      { when: { keys: [["command", "boost"]] }, middleware: (s) => s.sat.battery >= 20 },
    ],
  });

  const rejected = vi.fn();
  store.onEvent("command", "boost", rejected, "uncommitted");

  store.emit("command", "boost", null);

  expect(store.getState().sat.boosting).toBe(false); // el reducer nunca corrió
  expect(rejected).toHaveBeenCalledOnce();            // surge como uncommitted
});
```

---

## Probar suscripciones de grano fino

Valida que una suscripción a una ruta se dispare con la hoja correcta y — igual
de importante — que los cambios no relacionados **no** la disparen:

```ts
it("notifica solo la hoja que cambió", () => {
  const store = makeStore();
  const onValue = vi.fn();
  store.connect({ reducer: "counter", property: "value" }, onValue);

  store.emit("counter", "increment", 1);
  expect(onValue).toHaveBeenCalledTimes(1);

  store.emit("counter", "reset", null); // value 1 → 0, sigue siendo un cambio
  expect(onValue).toHaveBeenCalledTimes(2);
});
```

---

## Probar componentes

Da a cada test su propio store y provéelo con `<StoreProvider store={...}>` (los
hooks prefieren el store del contexto sobre el default del módulo). Usa
[@testing-library/react](https://testing-library.com/).

```tsx
import { render, screen, fireEvent } from "@testing-library/react";
import { StoreProvider, useAtomicProp, useEmit } from "@/state/yoltra";
import { makeStore } from "@/state/makeStore";

function Counter() {
  const value = useAtomicProp("counter", (s) => s.value);
  const emit = useEmit();
  return <button onClick={() => emit("counter", "increment", 1)}>{value}</button>;
}

it("incrementa al hacer click", () => {
  const store = makeStore(); // store nuevo y aislado
  render(
    <StoreProvider store={store}>
      <Counter />
    </StoreProvider>,
  );

  expect(screen.getByRole("button")).toHaveTextContent("0");
  fireEvent.click(screen.getByRole("button"));
  expect(screen.getByRole("button")).toHaveTextContent("1");
});
```

Exporta un `makeStore()` desde tu app (la misma fábrica usada arriba) para que el
código de la app y los tests construyan el store igual.

### Verificar re-renders de grano fino

Para probar que solo el componente correcto se re-renderizó, cuenta renders:

```tsx
let renders = 0;
function Value() {
  renders++;
  const v = useAtomicProp("counter", (s) => s.value);
  return <span>{v}</span>;
}
// emite un evento no relacionado → valida que `renders` NO aumentó
```

---

## Consejos

- **`dispose()` en `afterEach`** para liberar timers y suscripciones del store.
- **Dedup / timing:** el dedup está apagado por defecto, así que emisiones
  idénticas rápidas *no* se fusionan — no necesitas fake timers salvo que uses
  `dedupWindowMs`. Si lo usas, aplica `vi.useFakeTimers()`.
- **Sin `await` para leer:** usa `await emit()` solo cuando necesites que los
  effects del evento hayan terminado; `getState()` ya está al día para los
  resultados del reducer.
- **Prefiere tests a nivel de store** para la lógica y reserva los tests de
  componentes para el cableado — son más rápidos y no necesitan DOM.

---

## Siguientes pasos

- [Guía de Migración](./MIGRATION_GUIDE.md) — si vienes de Redux / Zustand / Jotai
- [Guía de Next.js](./NEXTJS_GUIDE.md) — uso en cliente con Pages y App Router
- [API de @yoltra/core](../../packages/core/README.es.md) · [API de @yoltra/react](../../packages/react/README.es.md)
