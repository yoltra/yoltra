# yoltra-react-counter

> 👉 🇲🇽 Versión en Español &nbsp;|&nbsp; [🇺🇸 English Version](./README.md)

Una aplicación de contador minimalista que demuestra los patrones principales de [Yoltra](https://github.com/yoltra/yoltra) con React 19. Este es el ejemplo referenciado en la [Guía de inicio rápido](https://github.com/yoltra/yoltra/blob/main/docs/es/QUICK_START_GUIDE.md).

> ⚡ **[Abrir la demo en vivo](https://yoltra.dev/es/demos/react-counter)** — sin instalar, corre en tu navegador.

---

## Qué demuestra este ejemplo

| Concepto | Ubicación |
|---|---|
| Configuración de una sola llamada con `createYoltra` (store + hooks tipados) | [src/state/yoltra.ts](./src/state/yoltra.ts) |
| Mapa de eventos (`AppEM`) para eventos con tipos seguros | [src/state/yoltra.ts](./src/state/yoltra.ts) |
| Suscripción de grano fino con un accessor tipado | [src/components/Counter.tsx](./src/components/Counter.tsx) |
| Despacho de eventos con `useEmit` | [src/components/Counter.tsx](./src/components/Counter.tsx) |
| Sin Provider — los hooks usan el store por defecto | [src/App.tsx](./src/App.tsx) |

---

## Stack tecnológico

- **React** 19
- **Vite** 7
- **TypeScript** 5.9
- **@yoltra/core** — store, reducers, pipeline de eventos
- **@yoltra/react** — hooks de React y `createYoltra`

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

### 1. Define el mapa de eventos

```ts
// src/state/yoltra.ts
export type AppEM = {
  counter: {
    increment: number;   // payload: cantidad a sumar
    decrement: number;   // payload: cantidad a restar
    reset: null;         // sin payload
  };
};
```

El **mapa de eventos** (`AppEM`) asocia cada par `(canal, tipo)` con el tipo de su payload. Yoltra lo utiliza para que `emit` y los hooks sean completamente seguros en tipos.

### 2. Crea el store y los hooks en una sola llamada

```ts
// src/state/yoltra.ts
export const { store, useAtomicProp, useEmit } = createYoltra({
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
      // `event.payload` se estrecha a number / null según `event.type` — sin casts.
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

`createYoltra` devuelve el store **y** todos los hooks tipados en una sola llamada — sin archivo de context aparte, sin `createHooks` y sin `<Provider>` (los hooks usan este store por defecto). `eventKeys` acota qué eventos activan el reducer, manteniéndolo enfocado y eficiente.

### 3. Suscríbete y emite eventos desde un componente

```tsx
// src/components/Counter.tsx
export function Counter() {
  // Accessor tipado — `s` autocompleta la slice, `value` se infiere como number.
  // Se re-renderiza SOLO cuando counter.value cambia; sin selectores, sin memo.
  const value = useAtomicProp("counter", (s) => s.value);
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

El accessor tipado `s => s.value` se suscribe exactamente a la hoja `counter.value`. Si cualquier otra parte del estado cambia, este componente **no** se re-renderizará. No hay selectores ni memoización — la suscripción por ruta _es_ la optimización. Para rutas dinámicas o con comodines (p. ej. `items.*.done`), la forma string `useAtomicProp({ reducer, property })` sigue disponible.

---

## Próximos pasos

- Agrega middleware síncrono (ej. logging, autorización) o efectos asíncronos — consulta la [documentación de @yoltra/core](https://github.com/yoltra/yoltra/blob/main/packages/core/README.md)
- Reacciona a eventos bloqueados con `useEvent(..., "uncommitted")` — consulta el [README principal](https://github.com/yoltra/yoltra/blob/main/docs/es/README.md)
- Explora rutas con comodines como `"items.*.done"` — consulta el [ejemplo de la aplicación Todo](https://github.com/yoltra/yoltra/blob/main/examples/v0/yoltra-in-react/README.md) · [▶ Abrir la demo en vivo](https://yoltra.dev/es/demos/in-react)

---

## Licencia

MIT
