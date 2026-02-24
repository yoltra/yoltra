# yoltra-react-counter

> 👉 🇲🇽 Versión en Español &nbsp;|&nbsp; [🇺🇸 English Version](./README.md)

Una aplicación de contador minimalista que demuestra los patrones principales de [Yoltra](https://github.com/yoltra/yoltra) con React 19. Este es el ejemplo referenciado en la [Guía de inicio rápido](https://github.com/yoltra/yoltra/blob/main/docs/es/QUICK_START_GUIDE.md).

---

## Qué demuestra este ejemplo

| Concepto | Ubicación |
|---|---|
| Store tipado con `createStore` | [src/state/store.ts](./src/state/store.ts) |
| Mapa de eventos (`AppEM`) para eventos con tipos seguros | [src/state/store.ts](./src/state/store.ts) |
| Hooks con alcance definido usando `createHooks` | [src/state/hooks.ts](./src/state/hooks.ts) |
| Suscripción de grano fino con `useAtomicProp` | [src/components/Counter.tsx](./src/components/Counter.tsx) |
| Despacho de eventos con `useEmit` | [src/components/Counter.tsx](./src/components/Counter.tsx) |
| Provisión del store mediante contexto de React | [src/App.tsx](./src/App.tsx) |

---

## Stack tecnológico

- **React** 19
- **Vite** 7
- **TypeScript** 5.9
- **@yoltra/core** — store, reducers, pipeline de eventos
- **@yoltra/react** — hooks de React e integración con contexto

---

## Ejecutar el ejemplo

```bash
# Desde la raíz del monorepo
rush install
rush build

# Luego inicia el servidor de desarrollo
cd examples/v0/yoltra-react-counter
pnpm dev
```

Abre [http://localhost:5173](http://localhost:5173).

---

## Recorrido por el código

### 1. Define la forma del estado y el mapa de eventos

```ts
// src/state/store.ts
export type AppEM = {
  counter: {
    increment: number;   // payload: cantidad a sumar
    decrement: number;   // payload: cantidad a restar
    reset: null;         // sin payload
  };
};

export type AppState = { counter: { value: number } };
```

El **mapa de eventos** (`AppEM`) es un tipo TypeScript plano que asocia cada par `(canal, tipo)` con el tipo de su payload. Yoltra lo utiliza para que `emit` y `useEvent` sean completamente seguros en tipos.

### 2. Crea el store

```ts
// src/state/store.ts
export const store = createStore<AppState, AppEM>({
  name: "App",
  reducer: {
    counter: {
      state: { value: 0 },
      when: {
        keys: eventKeys<AppEM>()([
          ["counter", "increment"],
          ["counter", "decrement"],
          ["counter", "reset"],
        ]),
      },
      reducer: (state, event) => {
        switch (event.type) {
          case "increment": return { value: state.value + event.payload };
          case "decrement": return { value: state.value - event.payload };
          case "reset":     return { value: 0 };
          default:          return state;
        }
      },
    },
  },
});
```

`eventKeys` acota qué eventos activan este reducer — solo las tres claves listadas lo ejecutarán, manteniendo tus reducers enfocados y eficientes.

### 3. Vincula los hooks al contexto del store

```ts
// src/state/hooks.ts
export const AppStoreContext = createContext<StoreInstance<...> | null>(null);

export const { useAtomicProp, useEmit, useEvent, useSelector, shallowEqual } =
  createHooks(AppStoreContext);
```

`createHooks` vincula cada hook a tu contexto específico, eliminando toda ambigüedad cuando coexisten múltiples stores en la misma aplicación.

### 4. Provee el store

```tsx
// src/App.tsx
function App() {
  return (
    <AppStoreContext.Provider value={store}>
      <Counter />
    </AppStoreContext.Provider>
  );
}
```

### 5. Suscríbete y emite eventos desde un componente

```tsx
// src/components/Counter.tsx
export function Counter() {
  // Se re-renderiza SOLO cuando counter.value cambia — nada más
  const value = useAtomicProp({ reducer: "counter", property: "value" });
  const emit = useEmit();

  return (
    <div>
      <h1>Contador: {value}</h1>
      <button onClick={() => emit("counter", "increment", 1)}>+</button>
      <button onClick={() => emit("counter", "decrement", 1)}>-</button>
      <button onClick={() => emit("counter", "reset", null)}>Reiniciar</button>
    </div>
  );
}
```

`useAtomicProp` se suscribe exactamente a la ruta `counter.value`. Si cualquier otra parte del estado cambia, este componente **no** se re-renderizará. No hay selectores ni memoización — la suscripción por ruta _es_ la optimización.

---

## Próximos pasos

- Agrega middleware (ej. logging, validación) — consulta la [documentación de @yoltra/core](https://github.com/yoltra/yoltra/blob/main/packages/core/README.md)
- Reacciona a eventos bloqueados con `useEvent(..., "uncommitted")` — consulta el [README principal](https://github.com/yoltra/yoltra/blob/main/docs/es/README.md)
- Explora rutas con comodines como `"items.*.done"` — consulta el [ejemplo de la aplicación Todo](https://github.com/yoltra/yoltra/blob/main/examples/v0/yoltra-in-react/README.md)

---

## Licencia

MIT
