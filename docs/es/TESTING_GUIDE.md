![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

# Guía de Testing

> [🇺🇸 English](../en/TESTING_GUIDE.md) &nbsp;|&nbsp; 👉 Español

Yoltra es inusualmente fácil de probar: los reducers son **puros**, la fase de reduce es
**síncrona** (así que `getState()` es correcto en el instante en que `emit()` retorna), y el store
corre con **cero dependencias de framework**. Los ejemplos usan [Vitest](https://vitest.dev), pero Jest funciona igual.

> **Guía completa:** [Testing en yoltra.dev](https://yoltra.dev/es/yoltra/docs/testing/)

## Probar el store (sin React)

Crea un store nuevo por test con una fábrica `makeStore()` que llama a `createStore({...})`, emite
eventos y valida con `getState()`. Llama a `store.dispose()` en `afterEach`.

```ts
it("reduce increment de forma síncrona", () => {
  const store = makeStore();
  store.emit("counter", "increment", 5);
  // Sin await: la fase de reduce es síncrona.
  expect(store.getState().counter.value).toBe(5);
});
```

## Probar reducers como funciones puras

Un reducer es solo `(state, event) => nextState`, así que puedes probarlo sin store:

```ts
const reducer = counterSpec.reducer;
expect(reducer({ value: 0 }, { type: "increment", payload: 2, channel: "counter" } as any))
  .toEqual({ value: 2 });
```

## Probar effects (async)

Mockea el I/O, emite el disparador y haz `await` del `emit`: la promesa resuelve cuando _los
effects de ese evento_ terminan.

```ts
await store.emit("todos", "fetch", null); // resuelve tras completar el effect
expect(api.getTodos).toHaveBeenCalledOnce();
expect(store.getState().todos.items).toHaveLength(1);
```

Prueba la ruta de fallo igual. Para la cancelación, desregistra el efecto (o `store.dispose()`)
mientras está pendiente: `ctx.signal` se aborta con `"effect unregistered"` (o `"store disposed"`).

## Probar componentes

Da a cada test su propio store con `<StoreProvider store={...}>` (los hooks prefieren el store del
contexto sobre el default del módulo), usando [@testing-library/react](https://testing-library.com/):

```tsx
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

## Controlar el tiempo

Un store lee la hora a través de `clock` y arma sus timers a través de `scheduler`, así que un test
puede controlar ambos sin falsear globales. `vi.useFakeTimers()` también funciona, aunque se instale
después de construir el store. El mismo `scheduler` maneja el timeout de inactividad de `store.call()`.

## Más en yoltra.dev

- [Probar middleware](https://yoltra.dev/es/yoltra/docs/testing/#probar-middleware-rechazo): solo un `false` explícito rechaza; obsérvalo con `onEvent(..., "uncommitted")` y prueba también el camino que permite.
- [Suscripciones de grano fino](https://yoltra.dev/es/yoltra/docs/testing/#probar-suscripciones-de-grano-fino) con `store.connect`, y [verificar re-renders](https://yoltra.dev/es/yoltra/docs/testing/#verificar-re-renders-de-grano-fino) contándolos.
- [Consejos](https://yoltra.dev/es/yoltra/docs/testing/#consejos): el dedup está apagado por defecto, `warnOnLargeValues` con un `warn` que lanza, prefiere tests a nivel de store.

## Siguientes pasos

- [Guía de Migración](./MIGRATION_GUIDE.md): si vienes de Redux / Zustand / Jotai
- [Guía de Next.js](./NEXTJS_GUIDE.md): uso en cliente con Pages y App Router
- [API de @yoltra/core](../../packages/core/README.es.md) · [API de @yoltra/react](../../packages/react/README.es.md)

> **Guía completa:** [Testing en yoltra.dev](https://yoltra.dev/es/yoltra/docs/testing/)
