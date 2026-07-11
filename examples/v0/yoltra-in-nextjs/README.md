![Yoltra logo](../../../assets/yoltra-logo.png)

# Yoltra in Next.js (React 19)

> [ 🇲🇽 Versión en Español](./README.es.md)&nbsp; | &nbsp; 👉
> [ 🇺🇸 English Version](./README.md)&nbsp;

> ⚡ **[Open the live demo](https://yoltra.dev/en/demos/in-nextjs)** — no install, runs in your browser.

A minimal example showing how **[Yoltra](https://yoltra.dev)** — fine-grained reactive state for
event-driven applications — runs **inside a Next.js (Pages Router) application** for client-side
interactivity.

This demo implements a simple **theme switcher** (light ↔ dark) powered by `@yoltra/core` and
`@yoltra/react`, proving Yoltra can manage application state seamlessly in **React 19 + Next.js
16**.

---

## Purpose

This example is designed to:

- Run **Yoltra inside a Next.js app** with one-call `createYoltra` setup (the store is a module
  singleton — per-request SSR isolation is out of scope for this client-focused demo)
- Showcase **atomic subscriptions** — UI updates only the components that depend on changed
  properties
- Implement a **theme system** using a Yoltra reducer and typed accessors

---

## Concept Overview

The app defines a `themeReducer` with two events:

| Event           | Purpose                                                 |
| :-------------- | :------------------------------------------------------ |
| `theme.set`     | Sets the preferred theme (`light`, `dark`, or `system`) |
| `theme.resolve` | Resolves the effective theme based on system preference |

The selected theme is applied to `document.documentElement.classList` (`theme-light` /
`theme-dark`) and persisted reactively using Yoltra’ **atomic property subscription** via
`useAtomicProp`.

---

## Structure

```
yoltra-in-nextjs/
├── src/
│   ├── components/
│   │   ├── Head.component.tsx
│   │   ├── Header.component.tsx
│   │   └── Content.component.tsx
│   ├── state/
│   │   ├── theme/Theme.reducer.ts
│   │   ├── yoltra.ts          createYoltra() — store + typed hooks
│   │   └── types.ts
│   └── pages/
│       └── index.tsx
└── package.json
```

---

## How to Run

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

Click the 🌙 / 🌞 icon in the header to toggle between light and dark modes. The change is
handled by **Yoltra** through an atomic property update.
