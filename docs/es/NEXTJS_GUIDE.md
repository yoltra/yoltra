![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

# Yoltra con Next.js

> [🇺🇸 English](../en/NEXTJS_GUIDE.md) &nbsp;|&nbsp; 👉 Español

Yoltra funciona en Next.js como estado **del lado del cliente**, en ambos routers, con un patrón para SSR seguro.

> **Guía completa:** [Next.js en yoltra.dev](https://yoltra.dev/es/yoltra/docs/nextjs/)

## Alcance: Yoltra es estado de cliente

SSR y los React Server Components están fuera de alcance por diseño: el estado vive en el navegador.
Trae los datos iniciales con las herramientas de Next (Server Components, `getServerSideProps`, route
handlers). **Los hooks corren en Client Components**: `"use client"` en el App Router; en el Pages Router ya lo son.

## Pages Router (el ejemplo incluido)

En el ejemplo [`yoltra-in-nextjs`](../../examples/v0/yoltra-in-nextjs) ([▶ Abrir la demo en vivo](https://yoltra.dev/es/demos/in-nextjs/)),
`createYoltra` se llama una vez en `state/yoltra.ts` y los componentes importan sus hooks sin
Provider. Envuelve con `<StoreProvider>` en `_app.tsx` solo para acotar una instancia específica.

## App Router

Los componentes del App Router son **Server Components por defecto**; pon el store y quien lo lee
detrás de `"use client"`. Un store de módulo (Patrón A) se evalúa una vez por proceso de servidor,
así que en SSR se comparte entre requests. Si renderizas en el servidor, créalo por render (Patrón B):

```mermaid
flowchart TD
    accTitle: Store de módulo frente a store por render
    accDescr: Un store a nivel de módulo lo comparten todas las requests que renderiza un proceso de servidor, mientras que un store creado en el provider existe una vez por render
    subgraph patternA ["Patrón A renderizado en el servidor"]
    direction TB
        reqA1(["request del usuario A"]) --> moduleStore["store a nivel de módulo<br/>evaluado una vez por proceso de servidor"]
        reqB1(["request del usuario B"]) --> moduleStore
        moduleStore --> shared(["el estado de A puede renderizarse en la página de B"])
    end

    subgraph patternB ["Patrón B"]
    direction TB
        reqA2(["request del usuario A"]) --> providerA["AppStoreProvider<br/>useState con makeStore"]
        reqB2(["request del usuario B"]) --> providerB["AppStoreProvider<br/>useState con makeStore"]
        providerA --> storeA["un store para este render"]
        providerB --> storeB["un store para este render"]
        storeA --> pageA(["página de A: los hooks debajo del provider usan el store de A"])
        storeB --> pageB(["página de B: los hooks debajo del provider usan el store de B"])
    end
```

```tsx
// state/StoreProvider.tsx
"use client";
import { useState, type ReactNode } from "react";
import { StoreProvider as YoltraProvider } from "@/state/yoltra";
import { makeStore } from "@/state/makeStore";

export function AppStoreProvider({ children }: { children: ReactNode }) {
  // Un store nuevo por render de cliente, nunca compartido entre requests.
  const [store] = useState(() => makeStore());
  return <YoltraProvider store={store}>{children}</YoltraProvider>;
}
```

Monta `AppStoreProvider` una vez en `app/layout.tsx`; los hooks debajo de él usan esa instancia.

## DevTools en Next.js

`withDevtools` usa el `WebSocket` del navegador, así que protégelo con `typeof window !== "undefined"`,
inicia el hub (`npx @yoltra/devtools-server --port 9800`) y abre el [panel de la extensión](../../devtools/devtools-ext/README.es.md).

## Checklist

Client Components; un store **por request** en SSR; `withDevtools` protegido; datos de servidor emitidos en el cliente.

## Siguientes pasos

- [Guía de Migración](./MIGRATION_GUIDE.md) · [Guía de Testing](./TESTING_GUIDE.md) · [API de @yoltra/react](../../packages/react/README.es.md)

> **Guía completa:** [Next.js en yoltra.dev](https://yoltra.dev/es/yoltra/docs/nextjs/)
