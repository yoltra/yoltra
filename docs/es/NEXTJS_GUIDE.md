![Yoltra logo](../../assets/yoltra-logo.png)

# Yoltra con Next.js

> [🇺🇸 English](../en/NEXTJS_GUIDE.md) &nbsp;|&nbsp; 👉 Español

Yoltra funciona muy bien en Next.js — como estado **del lado del cliente**. Esta
guía cubre ambos routers y los dos patrones que mantienen seguro el renderizado
en servidor.

---

## Alcance: Yoltra es estado de cliente

Yoltra es un contenedor de estado **del lado del cliente**: reactividad de grano
fino, un log de eventos y DevTools con time-travel para UIs interactivas. **El
renderizado en servidor (SSR) y los React Server Components están fuera de
alcance por diseño** — el estado de Yoltra vive y muta en el navegador. Eso no es
una carencia; es el nicho. Trae y renderiza tus datos iniciales con las
herramientas de Next (Server Components, `getServerSideProps`, route handlers), y
usa Yoltra para el estado interactivo de cliente encima.

En la práctica, eso significa que los hooks de Yoltra corren en **Client
Components** (`"use client"` en el App Router; en el Pages Router cada componente
ya lo es).

---

## Pages Router (el ejemplo incluido)

El ejemplo [`yoltra-in-nextjs`](../../examples/v0/yoltra-in-nextjs) usa el Pages
Router, donde cada componente es un Client Component — así que el modelo "sin
provider" de `createYoltra` simplemente funciona.

```ts
// state/yoltra.ts — creado una vez, los hooks usan este store
import { createYoltra } from "@yoltra/react";

export const { useAtomicProp, useEmit } = createYoltra({
  name: "App",
  reducer: { theme: themeReducer },
});
```

```tsx
// components/ThemeToggle.tsx — sin Provider
import { useAtomicProp, useEmit } from "@/state/yoltra";

export function ThemeToggle() {
  const theme = useAtomicProp({ reducer: "theme", property: "mode" });
  const emit = useEmit();
  return <button onClick={() => emit("theme", "toggle", null)}>{theme}</button>;
}
```

Envuelve con `<StoreProvider>` en `_app.tsx` solo si quieres acotar una instancia
específica del store; si no, el default del módulo está bien.

---

## App Router

Los componentes del App Router son **Server Components por defecto**, y los hooks
de Yoltra son solo de cliente. Pon el store y los componentes que lo leen detrás
de `"use client"`.

### Patrón A — singleton de cliente simple

Para un store puramente de cliente (inicializado en el navegador, no desde datos
del servidor), un store a nivel de módulo está bien:

```ts
// state/yoltra.ts
"use client";
import { createYoltra } from "@yoltra/react";

export const { useAtomicProp, useEmit } = createYoltra({
  name: "App",
  reducer: { cart: cartReducer },
});
```

```tsx
// components/Cart.tsx
"use client";
import { useAtomicProp, useEmit } from "@/state/yoltra";

export function Cart() {
  const count = useAtomicProp({ reducer: "cart", property: "items" }, (items) => items.length);
  // …
}
```

### Patrón B — aislamiento por request (recomendado para SSR)

Un store a nivel de módulo se evalúa **una vez por proceso de servidor**, así que
se **compartiría entre requests** durante SSR — el estado de un usuario podría
filtrarse al de otro. Si tus componentes renderizan en el servidor, crea el store
**por render** dentro de un provider de cliente:

```tsx
// state/StoreProvider.tsx
"use client";
import { useState, type ReactNode } from "react";
import { StoreProvider as YoltraProvider } from "@/state/yoltra";
import { makeStore } from "@/state/makeStore";

export function AppStoreProvider({ children }: { children: ReactNode }) {
  // Un store nuevo por render de cliente — nunca compartido entre requests.
  const [store] = useState(() => makeStore());
  return <YoltraProvider store={store}>{children}</YoltraProvider>;
}
```

```tsx
// app/layout.tsx (Server Component) — monta el provider de cliente una vez
import { AppStoreProvider } from "@/state/StoreProvider";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html><body><AppStoreProvider>{children}</AppStoreProvider></body></html>
  );
}
```

Donde `makeStore()` devuelve `createStore({...})` con tus reducers. Los hooks de
`createYoltra` prefieren el store provisto vía `StoreProvider`, así que todos los
componentes de cliente debajo del provider comparten esa instancia por request.

---

## DevTools en Next.js

`withDevtools` usa el `WebSocket` del navegador, que no existe durante el
renderizado en servidor — protégelo para que solo corra en el navegador:

```ts
import { withDevtools } from "@yoltra/devtools-browser-agent";

if (typeof window !== "undefined") {
  withDevtools(store, { port: 9800, allowReplay: true });
}
```

Inicia el hub (`npx @yoltra/devtools-server --port 9800`) y abre el panel de la
extensión — ver los [pasos de configuración local](../../devtools/devtools-ext/README.md)
una vez instalada la extensión.

---

## Checklist

- [ ] Los hooks de Yoltra viven en Client Components (`"use client"` en App Router).
- [ ] Para SSR, crea el store **por request** (Patrón B), no a nivel de módulo.
- [ ] Protege `withDevtools` con `typeof window !== "undefined"`.
- [ ] Trae los datos iniciales/de servidor con las herramientas de Next; hidrátalos
      en el store en el cliente (p. ej. emite un evento `init` en un effect o al montar).

---

## Siguientes pasos

- [Guía de Migración](./MIGRATION_GUIDE.md) · [Guía de Testing](./TESTING_GUIDE.md)
- [Ejemplo de Next.js](../../examples/v0/yoltra-in-nextjs) — Pages Router + cambio de tema
- [API de @yoltra/react](../../packages/react/README.es.md)
