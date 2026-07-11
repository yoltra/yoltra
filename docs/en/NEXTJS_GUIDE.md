![Yoltra logo](../../assets/yoltra-logo.png)

# Yoltra with Next.js

> 👉 English &nbsp;|&nbsp; [🇲🇽 Español](../es/NEXTJS_GUIDE.md)

Yoltra runs great in Next.js — as **client-side** state. This guide covers both
routers and the two patterns that keep server rendering safe.

---

## Scope: Yoltra is client state

Yoltra is a **client-side** state container: fine-grained reactivity, an event
log, and time-travel DevTools for interactive UIs. **Server-side rendering and
React Server Components are out of scope by design** — Yoltra state lives and
mutates in the browser. That's not a gap; it's the niche. Fetch and render your
initial data with Next's own tools (Server Components, `getServerSideProps`,
route handlers), and use Yoltra for the interactive client state on top.

Practically, that means Yoltra hooks run in **Client Components** (`"use client"`
in the App Router; every component in the Pages Router already is one).

---

## Pages Router (the included example)

The [`yoltra-in-nextjs`](../../examples/v0/yoltra-in-nextjs) example uses the
Pages Router, where every component is a Client Component — so `createYoltra`'s
"no provider needed" model just works.

```ts
// state/yoltra.ts — created once, hooks default to this store
import { createYoltra } from "@yoltra/react";

export const { useAtomicProp, useEmit } = createYoltra({
  name: "App",
  reducer: { theme: themeReducer },
});
```

```tsx
// components/ThemeToggle.tsx — no Provider required
import { useAtomicProp, useEmit } from "@/state/yoltra";

export function ThemeToggle() {
  const theme = useAtomicProp({ reducer: "theme", property: "mode" });
  const emit = useEmit();
  return <button onClick={() => emit("theme", "toggle", null)}>{theme}</button>;
}
```

Wrap with `<StoreProvider>` in `_app.tsx` only if you want to scope a specific
store instance; otherwise the module default is fine.

---

## App Router

App Router components are **Server Components by default**, and Yoltra hooks are
client-only. Put the store and the components that read it behind `"use client"`.

### Pattern A — simple client singleton

For a purely client store (initialized in the browser, not from server data), a
module-scoped store is fine:

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

### Pattern B — per-request isolation (recommended for SSR)

A module-scoped store is evaluated **once per server process**, so it would be
**shared across requests** during SSR — one user's state could leak into
another's. If your components render on the server at all, create the store
**per render** inside a client provider instead:

```tsx
// state/StoreProvider.tsx
"use client";
import { useState, type ReactNode } from "react";
import { StoreProvider as YoltraProvider } from "@/state/yoltra";
import { makeStore } from "@/state/makeStore";

export function AppStoreProvider({ children }: { children: ReactNode }) {
  // One fresh store per client render — never shared across requests.
  const [store] = useState(() => makeStore());
  return <YoltraProvider store={store}>{children}</YoltraProvider>;
}
```

```tsx
// app/layout.tsx (Server Component) — mount the client provider once
import { AppStoreProvider } from "@/state/StoreProvider";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html><body><AppStoreProvider>{children}</AppStoreProvider></body></html>
  );
}
```

Where `makeStore()` returns `createStore({...})` with your reducers.
`createYoltra`'s hooks prefer the store supplied via `StoreProvider`, so all
client components below the provider share that per-request instance.

---

## DevTools in Next.js

`withDevtools` uses the browser's `WebSocket`, which doesn't exist during
server rendering — guard it so it only runs in the browser:

```ts
import { withDevtools } from "@yoltra/devtools-browser-agent";

if (typeof window !== "undefined") {
  withDevtools(store, { port: 9800, allowReplay: true });
}
```

Start the hub (`npx @yoltra/devtools-server --port 9800`) and open the extension
panel — see the [local setup steps](../../devtools/devtools-ext/README.md) once
the extension is installed.

---

## Checklist

- [ ] Yoltra hooks live in Client Components (`"use client"` in App Router).
- [ ] For SSR, create the store **per request** (Pattern B), not module-scoped.
- [ ] Guard `withDevtools` with `typeof window !== "undefined"`.
- [ ] Fetch initial/server data with Next's tools; hydrate it into the store on
      the client (e.g. emit an `init` event in an effect or on mount).

---

## Next steps

- [Migration Guide](./MIGRATION_GUIDE.md) · [Testing Guide](./TESTING_GUIDE.md)
- [Next.js example](../../examples/v0/yoltra-in-nextjs) — Pages Router + theme switcher
- [@yoltra/react API](../../packages/react/README.md)
