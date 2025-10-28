# @quojs/react — Bindings de React para Quo.js

> [ 🇲🇽 Versión en Español](./README.es.md)&nbsp; |
> &nbsp;[ 🇵🇹 Versão Portuguesa](./README.pt.md)&nbsp; |
> &nbsp;[ 🇺🇸 English Version](./README.md)&nbsp; | &nbsp; 👉
> [ 🇫🇷 Version française](./README.fr.md)

Vinculações oficiais do React para **Quo.js**, um contêiner de estado previsível que recupera a
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
    `clearSuspenseCache`

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

Siga as instruções em **Quo.js** sobre [como criar uma Store](https://quojs.dev/?lang=fr)

### Contexto da AppStore

Use o `React Context` para expor sua Store ao seu App.

```tsx
// arquivo: ./context/QuoStoreContext.ts
import { createContext } from "react";
import type { AppStore } from "store.ts";

export const QuoStoreContext = createContext<AppStore | null>(null);
```

### Ganchos

Crie e exporte **hooks tipados** usando `createQuoHooks`.

```tsx
import { createQuoHooks } from "@quojs/react";

import { QuoStoreContext } from "./context/QuoStoreContext.ts";
import type { AppAM, AppState } from "./types"; // <-- obtenha estes na etapa de criação de uma store

export const { useStore, useDispatch, useSelector, useSliceProp, useSliceProps, shallowEqual } =
  createQuoHooks<keyof AppState & string, AppState, AppAM>(QuoStoreContext);
```

Envolva seu aplicativo no _provider_ da **Quo**.

```tsx
import React from "react";
import { createRoot } from "react-dom/client";

import { QuoStoreContext } from "./context/QuoStoreContext.ts";
import { store, type AppStore } from "store.ts";

import { App } from "./App";

criarRaiz(document.getElementById("raiz")!).render(
   <React.StrictMode>
     <QuoStoreContext.Provider value={store}>
       <App />
     </StoreProvider>
   </React.StrictMode>
);
```

Use os hooks para conectar seus componentes ao Quo.

```tsx
import React from "react";
import { useDispatch, useSliceProp } from "@quojs/react";

export function Atômico() {
   // grão fino: só renderiza novamente quando "count.value" muda
   const valor = useSliceProp({
     redutor: "contagem",
     propriedade: "valor",
   });

retornar <h1>Contador: {valor}</h1>;
}

export function App() {
   const dispatch = useDispatch<any>();

retornar (
     <div>
       <Atômico />
       <button onClick={() => dispatch("count", "subtract", 1)}>-1</button>
       <button onClick={() => dispatch("count", "add", 1)}>+1</button>
       <button onClick={() => dispatch("count", "set", 0)}>Redefinir</button>
     </div>
   );
}
```

Pronto: sem thunks nem geradores. Você modela eventos reais e conecta seus reducers a
`(canal, evento)`.

## Documentação

- [Desenvolvedor](https://quojs.dev/?lang=fr): guia de início rápido, tutorial, gists, etc.
- [TypeDoc](./docs/en/README.md): uma documentação mais técnica extraída usando TypeDoc.
