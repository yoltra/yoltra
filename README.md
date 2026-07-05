![Yoltra logo](./assets/yoltra-logo.png)

# Yoltra

> [ 🇲🇽 Versión en Español](./docs/es/README.md)&nbsp; | &nbsp; 👉 🇺🇸 English Version &nbsp;

![npm downloads](https://badgen.net/npm/dm/@yoltra/core)
![License](https://img.shields.io/npm/l/@yoltra/core)

**Fine-grained reactive state, event-sourced, with time-travel devtools — for complex,
interactive apps.**

![Kinetic Logo Demo](./assets/yoltra-dots.gif)

> 3000 circles, each subscribing to its own position. Every circle re-renders independently —
> the rest of the tree is untouched. No selectors. No memoization.
> [See the demo source.](https://github.com/yoltra/yoltra/blob/main/examples/v0/yoltra-kinetic-logo/README.md)

---

## The 30-second pitch

One call gives you a store **and** fully-typed hooks. Subscribe to a path with a typed accessor,
and the component re-renders only when that exact leaf changes:

```tsx
import { createYoltra } from "@yoltra/react";

// One call — store + typed hooks. No context, no createHooks, no boilerplate.
export const { useAtomicProp, useEmit } = createYoltra({
  name: "App",
  reducer: {
    todos: {
      state: { items: [{ id: "1", title: "Buy milk", done: false }] },
      events: [["todos", "rename"]],
      reducer: (s, e) =>
        e.type === "rename"
          ? { items: s.items.map((t) => (t.id === e.payload.id ? { ...t, title: e.payload.title } : t)) }
          : s,
    },
  },
});

function TodoTitle() {
  // Typed accessor: autocompletes `items[0].title`, infers `string`.
  // Re-renders ONLY when this exact leaf changes — no selectors, no memo.
  const title = useAtomicProp("todos", (s) => s.items[0].title);
  const emit = useEmit();
  return <span onClick={() => emit("todos", "rename", { id: "1", title: "New title" })}>{title}</span>;
}
```

The subscription _is_ the optimization.

---

## What makes Yoltra different

Most state libraries make you pick two of the following. Yoltra is built to give you all four at
once — that intersection is where it lives:

|                    | Fine-grained (no manual memo) | Event log + time-travel  |  One-call setup  | Typed paths / end-to-end types |
| ------------------ | :---------------------------: | :----------------------: | :--------------: | :----------------------------: |
| **Redux Toolkit**  |      ✗ selectors + memo       | ✓ (the reason many stay) |  ✗ boilerplate   |            partial             |
| **Zustand**        |       ✗ manual equality       |            ✗             |        ✓         |            partial             |
| **Jotai / Recoil** |            ✓ atoms            |            ✗             |        ✓         |               ✓                |
| **Valtio / MobX**  |         ✓ proxy magic         |            ✗             |        ✓         |            partial             |
| **Signals**        |               ✓               |            ✗             |        ✓         |               ✓                |
| **Yoltra**         |     ✓ path subscriptions      |      ✓ **built-in**      | ✓ `createYoltra` |       ✓ typed accessors        |

The fine-grained camp (Jotai, Valtio, signals) has thin devtools and no event log. The
event-sourced camp (Redux) has great devtools but coarse reactivity and boilerplate. **Yoltra is
the one place you get fine-grained reactivity, an event log with real time-travel, one-call
setup, and full type-safety — together.** A deeper, honest comparison lives in the
[library comparison](./docs/en/design/state-management-library-comparison.md).

---

## Killer features

### Fine-grained by default — delete your `useMemo`s

Subscribe to `items.0.title` or the wildcard `items.*.done` and re-render only when that exact
path changes — across nested objects, arrays, and dynamic keys. No selectors, no memoization, no
`React.memo` on every leaf.

```tsx
// Typed accessor — autocompletes the shape, infers the return type
const title = useAtomicProp("todos", (s) => s.items[0].title);

// String form (for dynamic paths) + wildcard
const allDone = useAtomicProp({ reducer: "todos", property: "items.*.done" }, (s) =>
  s.items.every((i) => i.done),
);
```

[See the flamegraph comparison (Redux vs Yoltra).](https://github.com/yoltra/yoltra/blob/main/examples/v0/yoltra-in-react/redux-yoltra-profiler.md)

### Time-travel devtools that show exactly what changed

Because Yoltra is event-sourced, its devtools are first-class — not an afterthought. The store
reports the **precise leaf paths** that changed on every event, so the panel renders exact RFC-6902
patches (`replace /todos/items/0/title`), a filterable event log with committed/rejected events,
real metrics (reduce timing, dedup hits, queue depth), and **time-travel + event replay**. This is
the capability the fine-grained camp can't cheaply match.

### One call to set up — no boilerplate

`createYoltra(spec)` returns the store and every typed hook (`useAtomicProp`, `useEmit`,
`useEvent`, `useSelector`, …). The hooks default to that store, so a `<Provider>` is optional. No
separate context file, no `createHooks` wiring.

### Predictable, honest `emit`

The reduce phase (middleware → reducers → subscribers → coarse listeners) runs **synchronously**,
so `getState()` is correct the instant `emit()` returns — even with middleware. Effects run
afterward, asynchronously, and the returned promise resolves only once _this_ event's effects
finish. No stale reads, no "sometimes sync, sometimes async."

### Events you can intercept, reject, and audit

Events are `(channel, type, payload)` tuples — natural namespacing that scales without collisions.
They flow through a hookable pipeline. Middleware can **reject** an event, producing an
_uncommitted_ event your UI can react to — ideal for authorization, validation, and optimistic UI:

```tsx
await emit("auth", "login", credentials);
await emit("analytics", "track", event);

// React when middleware blocks a delete
useEvent("ui", "delete", () => showToast("Delete was blocked by permissions"), "uncommitted");
```

### No silent surprises

Content-based dedup is **off by default** — Yoltra never silently swallows two legitimate rapid
events (double-clicks, repeated `+1`). Opt into coalescing with `dedupWindowMs`, or use a per-emit
`dedupKey` for identity-based dedup (e.g. a React Strict Mode double-invoke). Writes cost
O(change), not O(state size): a one-field update never clones or re-freezes the whole slice.

---

## Packages

| Package                                                                                  | Description                                                                                                  |
| ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| **[@yoltra/core](https://github.com/yoltra/yoltra/blob/main/packages/core/README.md)**   | Framework-agnostic store: reducers, middleware, effects, fine-grained change tracking, typed instrumentation |
| **[@yoltra/react](https://github.com/yoltra/yoltra/blob/main/packages/react/README.md)** | React hooks: fine-grained subscriptions, typed path accessors, `createYoltra`, Suspense                      |
| **@yoltra/devtools-\***                                                                  | DevTools suite: protocol, hub server, browser/node agents, and the panel UI (browser extension + CLI)        |

---

## Quick start (React)

[Quick-start guide](./docs/en/QUICK_START_GUIDE.md) — a working app in under 3 minutes.

## DevTools

Yoltra's store exposes a typed instrumentation seam (`store.instrument(...)`) that the agents
consume with zero `as any` casts. A small hub relays events from your running app to the panel;
the panel renders the event log, the live state tree, precise per-event patches, metrics, and
time-travel. The browser and node agents are deliberately separate packages so a web bundle never
pulls in a Node-only WebSocket, and vice versa.

---

## Live examples

| Example                                                                                                                   | Description                                                                                                                                                |
| ------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **[Kinetic Logo (3000 particles)](https://github.com/yoltra/yoltra/blob/main/examples/v0/yoltra-kinetic-logo/README.md)** | Physics simulation with an independent path subscription per circle                                                                                        |
| **[Todo App with Profiler](https://github.com/yoltra/yoltra/blob/main/examples/v0/yoltra-in-react/README.md)**            | Side-by-side flamegraph comparison with Redux ([results](https://github.com/yoltra/yoltra/blob/main/examples/v0/yoltra-in-react/redux-yoltra-profiler.md)) |
| **[Counter](https://github.com/yoltra/yoltra/blob/main/examples/v0/yoltra-react-counter/README.md)**                      | The minimal end-to-end example                                                                                                                             |

---

## Documentation

- **[Quick Start Guide](https://github.com/yoltra/yoltra/blob/main/docs/en/QUICK_START_GUIDE.md)** — five steps to a working app
- **[@yoltra/core API](https://github.com/yoltra/yoltra/blob/main/packages/core/README.md)** — store, middleware, effects, `When` matchers, instrumentation
- **[@yoltra/react API](https://github.com/yoltra/yoltra/blob/main/packages/react/README.md)** — hooks, typed accessors, `createYoltra`, Suspense
- **[Event Pipeline Architecture](https://github.com/yoltra/yoltra/blob/main/docs/en/design/event-queue-architecture.md)** — how the synchronous reduce / async effect pipeline works
- **[Library Comparison](https://github.com/yoltra/yoltra/blob/main/docs/en/design/state-management-library-comparison.md)** — honest architectural comparison with Redux, Zustand, Jotai, and others

---

## Contributing

We welcome contributions! Please read the
[Contributing Guide](https://github.com/yoltra/yoltra/blob/main/CONTRIBUTING.md),
[Code of Conduct](https://github.com/yoltra/yoltra/blob/main/CODE_OF_CONDUCT.md),
[Governance](https://github.com/yoltra/yoltra/blob/main/GOVERNANCE.md), and
[Security Policy](https://github.com/yoltra/yoltra/blob/main/SECURITY.md).

---

## Development (Monorepo)

```bash
npm i -g @microsoft/rush
rush install
rush build
rush test
```

See the
**[Developer Guide](https://github.com/yoltra/yoltra/blob/main/docs/en/DEVELOPER_GUIDE.md)** for
more details.

---

## Status

Yoltra is in **Release Candidate** stage (v0.1.0):

- The core and React APIs are stable and used in production applications.
- TypeScript types are strict and comprehensive.
- The DevTools suite is the newest addition and still stabilizing.
- Minor APIs may still evolve before v1.0.

Feedback and PRs are welcome.

---

## License

**MIT** — free to use in commercial and open-source projects.
See [LICENSE](https://github.com/yoltra/yoltra/blob/main/LICENSE) for details.

---

## Community

- **Website:** [yoltra.dev](https://yoltra.dev)
- **Twitter/X:** [@yoltra_dev](https://twitter.com/yoltra_dev)
- **GitHub Discussions:** [Join the conversation](https://github.com/yoltra/yoltra/discussions)
- **Issues:** [Report bugs or request features](https://github.com/yoltra/yoltra/issues)
