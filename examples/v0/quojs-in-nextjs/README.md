![Quo.js logo](https://quojs.dev/assets/logo.svg)

# Quo.js in Next.js (React 19)

> [ 🇲🇽 Versión en Español](./README.es.md)&nbsp; |
> &nbsp;[ 🇵🇹 Versão Portuguesa](./README.pt.md)&nbsp; |
> &nbsp; 👉 [ 🇺🇸 English Version](./README.md)&nbsp; | &nbsp;[ 🇫🇷 Version française](./README.fr.md)

A minimal example showing how **[Quo.js](https://quojs.dev)** — fine-grained reactive state for event-driven applications — can run **inside a Next.js (App Router) application**, including SSR-compatible client components.

This demo implements a simple **theme switcher** (light ↔ dark) powered by `@quojs/core` and `@quojs/react`, proving Quo.js can manage application state seamlessly in **React 19 + Next.js 16**.

---

## 🎯 Purpose

This example is designed to:

- ✅ Demonstrate that **Quo.js works under Next.js SSR** (Server-Side Rendering)  
- ⚡ Showcase **atomic subscriptions** — UI updates only the components that depend on changed properties  
- 🌗 Implement a **theme system** using Quo.js reducers and atomic selectors  

---

## 🧠 Concept Overview

The app defines a `themeReducer` with two events:

| Event | Purpose |
|:--|:--|
| `theme.set` | Sets the preferred theme (`light`, `dark`, or `system`) |
| `theme.resolve` | Resolves the effective theme based on system preference |

The selected theme is applied to `document.documentElement.classList` (`theme-light` / `theme-dark`) and persisted reactively using Quo.js’ **atomic property subscription** via `useAtomicProp`.

---

## 📂 Structure

```
quojs-in-nextjs/
├── src/
│   ├── components/
│   │   ├── Head.component.tsx
│   │   ├── Header.component.tsx
│   │   └── Content.component.tsx
│   ├── context/
│   │   └── Store.context.ts
│   ├── state/
│   │   ├── theme/Theme.reducer.ts
│   │   ├── hooks.ts
│   │   ├── store.ts
│   │   └── types.ts
│   └── pages/
│       └── index.tsx
└── package.json
```

---

## ⚙️ How to Run

First, install dependencies:

```bash
rush update
```

Then, open a terminal on this directory and run:

```bash
rush dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### 3. Switch themes

Click the 🌙 / 🌞 icon in the header to toggle between light and dark modes.  
The change is handled by **Quo.js** through an atomic property update.
