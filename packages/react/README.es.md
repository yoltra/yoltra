# @quojs/react — Bindings de React para Quo.js

> 👉 [ 🇲🇽 Versión en Español](./README.es.md)&nbsp; |
> &nbsp;[ 🇵🇹 Versão Portuguesa](./README.pt.md)&nbsp; |
> &nbsp;[ 🇺🇸 English Version](./README.md)&nbsp; | &nbsp;[ 🇫🇷 Version française](./README.fr.md)

Bindings oficiales de React para **Quo.js**, un contenedor de estado predecible que recupera la
simplicidad del Redux clásico y agrega:

- **Canales + eventos** en lugar de tipos de acción
- **Middleware nativo asíncrono** y **efectos**, sin ceremonias de thunks/sagas
- **suscripciones atómicas** a rutas punteadas exactas o con comodines
- **Inmutabilidad** garantizada con deep‑freeze y detección precisa de cambios
- Una API pequeña y explícita sobre la cual razonar

Este paquete provee:

- `<StoreProvider>` para exponer el store de Quo.js en el contexto de React
- Hooks:
  - `useStore`, `useDispatch`, `useSelector`
  - `useSliceProp` y `useSliceProps` para renderizados **de grano fino**
  - `useSuspenseSliceProp` y `useSuspenseSliceProps` para flujos con **Suspense**
  - Utilidades de caché para Suspense: `invalidateSliceProp`, `invalidateSlicePropsByReducer`,
    `clearSuspenseCache`

## Instalación

Instala Quo.js y los enlaces para React:

```bash
npm i @quojs/core @quojs/react
# o
yarn add @quojs/core @quojs/react
# o
pnpm add @quojs/core @quojs/react
```

Dependencias peer que debes tener: `react` y `react-dom` (React 18+). Se recomienda TypeScript.

## Inicio Rápido

### Crear una Store

Sigue las instrucciones en **Quo.js** sobre
[como crear una Store](https://quojs.dev/?lang=es).

### AppStore Context

Usa `React Context` para exponer tu Store a tu App.

```tsx
// file: ./context/QuoStoreContext.ts
import { createContext } from "react";
import type { AppStore } from "store.ts";

export const QuoStoreContext = createContext<AppStore | null>(null);
```

### Hooks

Crea y exporta **hooks tipados** usando `createQuoHooks`.

```tsx
import { createQuoHooks } from "@quojs/react";

import { QuoStoreContext } from "./context/QuoStoreContext.ts";
import type { AppAM, AppState } from "./types"; // <-- obten estos en la etapa de crear una store

export const { useStore, useDispatch, useSelector, useSliceProp, useSliceProps, shallowEqual } =
  createQuoHooks<keyof AppState & string, AppState, AppAM>(QuoStoreContext);
```

Envuelve tu App en el _provider_ de **Quo**.

```tsx
import React from "react";
import { createRoot } from "react-dom/client";

import { QuoStoreContext } from "./context/QuoStoreContext.ts";
import { store, type AppStore } from "store.ts";

import { App } from "./App";

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QuoStoreContext.Provider value={store}>
      <App />
    </StoreProvider>
  </React.StrictMode>
);
```

Usa los hooks para conectar tus componentes a Quo.

```tsx
import React from "react";
import { useDispatch, useSliceProp } from "@quojs/react";

export function Atomic() {
  // grano fino: solo re-renderiza cuando "count.value" cambia
  const value = useSliceProp({
    reducer: "count",
    property: "value",
  });

  return <h1>Counter: {value}</h1>;
}

export function App() {
  const dispatch = useDispatch<any>();

  return (
    <div>
      <Atomic />
      <button onClick={() => dispatch("count", "subtract", 1)}>-1</button>
      <button onClick={() => dispatch("count", "add", 1)}>+1</button>
      <button onClick={() => dispatch("count", "set", 0)}>Reset</button>
    </div>
  );
}
```

Listo: sin thunks ni generadores. Modelas eventos reales y conectas tus reducers a
`(channel, event)`.

## Docs

- [Desarrollador](https://quojs.dev/?lang=es): guía de inicio rápido, tutorial, gists,
  etc.
- [TypeDoc](./docs/README.md): una documentación más técnica extraída utilizando TypeDoc (en Inglés).
