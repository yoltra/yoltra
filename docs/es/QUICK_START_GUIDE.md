![Yoltra logo](../../assets/yoltra-logo.png)

# Guía de Inicio Rápido

> [🇺🇸 English](../en/QUICK_START_GUIDE.md) &nbsp;|&nbsp; 👉 Español

Tres pasos desde la instalación hasta una app funcional y totalmente tipada. Si prefieres, visita
[la app de ejemplo](../../examples/v0/yoltra-react-counter/README.es.md).

---

## 1. Instalar

```bash
npm install @yoltra/core @yoltra/react
```

(`@yoltra/react` solo es necesario al usar React.)

---

## 2. Crea tu store y tus hooks tipados en una sola llamada

`createYoltra` colapsa el store, el context de React, `createHooks` y el provider en una sola
llamada. Devuelve el `store` **y** todos los hooks, ya tipados a tu estado y a tu mapa de eventos.

```tsx
// yoltra.ts
import { eventKeys } from "@yoltra/core";
import { createYoltra } from "@yoltra/react";

// 1. Describe tus eventos: canal -> tipo -> tipo del payload.
type AppEM = {
  counter: {
    increment: number;
    decrement: number;
    reset: null;
  };
};

// Una llamada — store + todos los hooks tipados. Sin archivo de context, sin createHooks, sin Provider.
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
      // `event.payload` se estrecha a `number` / `null` según `event.type` — sin casts.
      reducer: (state, event) => {
        switch (event.type) {
          case "increment":
            return { value: state.value + event.payload };
          case "decrement":
            return { value: state.value - event.payload };
          case "reset":
            return { value: 0 };
          default:
            return state;
        }
      },
    },
  },
});
```

---

## 3. Usa los hooks en los componentes

Los hooks usan por defecto el store que acabas de crear, así que **no se requiere ningún
`<Provider>`**. Suscríbete a una hoja con un accessor tipado — el componente se re-renderiza solo
cuando esa hoja exacta cambia.

```tsx
// Counter.tsx
import { useAtomicProp, useEmit } from "./yoltra";

export function Counter() {
  // Forma objeto: suscríbete a la hoja exacta `counter.value`.
  // Se re-renderiza SOLO cuando counter.value cambia — sin selectores, sin memo.
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

Eso es una app completa y con tipado seguro. `emit("counter", "increment", 1)` se verifica contra
tu mapa de eventos — un canal, tipo o payload incorrecto es un error de compilación.

---

## (Opcional) Acota un store con `StoreProvider`

Solo necesitas un provider para entregar una instancia **diferente** del store a una parte del
árbol — por ejemplo, un store nuevo por test, o dos instancias independientes de la misma app.
`createYoltra` también devuelve un `StoreProvider` para exactamente eso:

```tsx
import { createYoltra } from "@yoltra/react";

const { store, StoreProvider, useAtomicProp } = createYoltra({ name: "App", reducer: { counter } });

// Entrega una instancia especifica a un subarbol (usa el store de arriba si se omite).
<StoreProvider store={storeNuevoParaEsteTest}>
  <Counter />
</StoreProvider>;
```

Para casos avanzados — compartir un mismo conjunto de hooks entre varios stores cableados a tu
propio context de React — la API de nivel más bajo `createHooks(context)` sigue disponible.

---

## ¿Qué sigue?

- **[API de @yoltra/core](https://github.com/yoltra/yoltra/blob/main/packages/core/README.md)**
  — Middleware, efectos, matchers `When`, suscripciones a eventos, instrumentación
- **[API de @yoltra/react](https://github.com/yoltra/yoltra/blob/main/packages/react/README.md)**
  — `useAtomicProps`, accessors tipados, wildcards, hooks con Suspense
- **[Arquitectura del Pipeline de Eventos](./design/event-queue-architecture.md)** — cómo funciona
  el pipeline de reducción síncrona / efectos asíncronos internamente
- **[Comparación de Librerías](./design/state-management-library-comparison.md)** — comparación
  arquitectónica honesta con Redux, Zustand, Jotai y otras
- **[Ejemplos](https://github.com/yoltra/yoltra/blob/main/README.md#live-examples)** — app de
  tareas, logo cinético, contador
- **[Guía del Desarrollador](./DEVELOPER_GUIDE.md)** — configurar el monorepo y contribuir
