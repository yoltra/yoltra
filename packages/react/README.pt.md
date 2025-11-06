# @quojs/react — Bindings de React para Quo.js

> [ 🇲🇽 Versión en Español](./README.es.md)&nbsp; | &nbsp; 👉
> [ 🇵🇹 Versão Portuguesa](./README.pt.md)&nbsp; | &nbsp;[ 🇺🇸 English Version](./README.md)&nbsp;
> | &nbsp;[ 🇫🇷 Version française](./README.fr.md)

![Bundle size](https://badgen.net/bundlephobia/min/@quojs/react)
![Bundle size](https://badgen.net/bundlephobia/minzip/@quojs/react)
![Bundle size](https://badgen.net/bundlephobia/tree-shaking/@quojs/react)
![Bundle size](https://badgen.net/bundlephobia/dependency-count/@quojs/react)
![npm version](https://badgen.net/npm/v/@quojs/react)
![npm downloads](https://badgen.net/npm/dm/@quojs/react)
![License](https://badgen.net/npm/license/@quojs/react)

Ligações oficiais do React para **Quo.js**, um contêiner de estado previsível que recupera a
simplicidade do Redux clássico e adiciona:

- **Canais + eventos** em vez de tipos de ação
- **Middleware nativo assíncrono** e **efeitos**, sem a cerimônia de thunks/sagas
- **assinaturas atômicas** para rotas exatas ou com curingas
- **Imutabilidade** garantida com congelamento profundo e detecção precisa de alterações
- Uma API pequena e explícita sobre a qual raciocinar

Este pacote fornece:

- `<StoreProvider>` para expor a store do Quo.js no contexto do React
- Ganchos:
  - `useStore`, `useDispatch`, `useSelector`
  - `useSliceProp` e `useSliceProps` para renderizações **de grão fino**
  - `useSuspenseSliceProp` e `useSuspenseSliceProps` para fluxos com **Suspense**
  - Utilitários de cache para Suspense: `invalidateSliceProp`, `invalidateSlicePropsByReducer`,
    `limparCacheSuspensão`

## Instalação

Instale Quo.js e os links para React:

```bash
npm i @quojs/core @quojs/react
# o
yarn add @quojs/core @quojs/react
# o
pnpm add @quojs/core @quojs/react
```

Dependências peer que você deve ter: `react` e `react-dom` (React 18+). Recomenda-se TypeScript.

## Início Rápido

### Criar uma Loja

Siga as instruções em **Quo.js** sobre [como criar uma Store](https://quojs.dev/?lang=pt).

### Contexto da AppStore

Use o `React Context` para expor sua Store ao seu App.

```tsx
// arquivo: ./context/QuoStoreContext.ts
import { createContext } from "react";
import type { AppStore } from "store.ts";

export const QuoStoreContext = createContext<AppStore | null>(null);
```

### Hooks

Crie e exporte **hooks tipados** usando `createQuoHooks`.

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

- [Desarrollador](https://quojs.dev/?lang=pt): guía de inicio rápido, tutorial, gists, etc.
- [TypeDoc](./docs/README.md): una documentación más técnica extraída utilizando TypeDoc (em
  inglês).
