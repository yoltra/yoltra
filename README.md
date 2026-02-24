![Yoltra logo](./assets/yoltra-logo.png)

# Yoltra

> [ 🇲🇽 Versión en Español](./docs/es/README.md)&nbsp; | &nbsp; 👉 🇺🇸 English Version &nbsp;

![npm downloads](https://badgen.net/npm/dm/@yoltra/core)
![License](https://img.shields.io/npm/l/@yoltra/core)

**Fine-grained reactive state for event-driven applications.**

![Kinetic Logo Demo](./assets/yoltra-dots.gif)

> 3000 circles, each subscribing to its own position via `useAtomicProp`. Every circle
> re-renders independently — the rest of the tree is untouched.
> [See the demo source.](https://github.com/yoltra/yoltra/blob/main/examples/v0/yoltra-kinetic-logo/README.md)

---

## The 30-second pitch

```tsx
import { useAtomicProp, useEmit } from "./hooks";

function TodoTitle({ index }: { index: number }) {
  // Subscribes to items[index].title — re-renders ONLY when it changes.
  const title = useAtomicProp({
    reducer: "todos",
    property: `items.${index}.title`,
  });
  const emit = useEmit();

  return (
    <span onClick={() => emit("todos", "edit", { index, title: "New title" })}>{title}</span>
  );
}
```

No selectors. No memoization. No manual optimization. The subscription _is_ the optimization.

> Yoltra is a fork of [Quo.js](https://github.com/quojs/quojs), we decided to leave the
> **Quo.js** name to stop SEO-fighting zombie libraries that are dead but still around.

---

## Why Yoltra?

### 1. Fine-grained path subscriptions with wildcards

Subscribe to `"items.0.title"` or `"items.*.done"` and only re-render when that exact path
changes. This works over a full state tree — including nested objects, arrays, and dynamic keys.

```tsx
// Exact path — re-renders when items[0].title changes
const title = useAtomicProp({ reducer: "todos", property: "items.0.title" });

// Wildcard — re-renders when ANY item's 'done' flag changes
const allDone = useAtomicProp({ reducer: "todos", property: "items.*.done" }, (state) =>
  state.items.every((i) => i.done),
);
```

[See the flamegraph comparison (Redux vs Yoltra).](https://github.com/yoltra/yoltra/blob/main/examples/v0/yoltra-in-react/redux-yoltra-profiler.md)

### 2. Structured event pipeline

Events flow through a formal pipeline where every stage is hook-able:

```
emit() → dedup → middleware (can reject) → reducers → event subscribers → effects → coarse subscribers
```

Middleware rejection creates **uncommitted events** that the UI can react to — useful for
authorization, validation, and optimistic UI patterns:

```tsx
// Show a warning when middleware blocks a delete
useEvent(
  "ui",
  "delete",
  (event) => {
    showToast("Delete was blocked by permissions");
  },
  "uncommitted",
);
```

### 3. Channel-based event organization

Events are `(channel, type, payload)` tuples — natural namespacing that scales without
collisions:

```typescript
await emit("auth", "login", credentials);
await emit("analytics", "track", event);
await emit("ui", "toast", { message: "Saved!" });
```

---

## Packages

| Package                                                                                  | Description                                                      |
| ---------------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| **[@yoltra/core](https://github.com/yoltra/yoltra/blob/main/packages/core/README.md)**   | Framework-agnostic store, reducers, middleware, effects          |
| **[@yoltra/react](https://github.com/yoltra/yoltra/blob/main/packages/react/README.md)** | React hooks with fine-grained subscriptions and Suspense support |

---

## Quick Setup (React)

[Quick-start](./docs/en/QUICK_START_GUIDE.md) - an example app in less than 3 minutes.

## Live Examples

| Example                                                                                                                   | Description                                                                                                                                                         |
| ------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **[Kinetic Logo (3000 particles)](https://github.com/yoltra/yoltra/blob/main/examples/v0/yoltra-kinetic-logo/README.md)** | (React) Physics simulation with independent path subscriptions per circle                                                                                           |
| **[Todo App with Profiler](https://github.com/yoltra/yoltra/blob/main/examples/v0/yoltra-in-react/README.md)**            | Side-by-side flamegraph comparison with Redux ([profiler results](https://github.com/yoltra/yoltra/blob/main/examples/v0/yoltra-in-react/redux-yoltra-profiler.md)) |
| **[Next.js 15 App Router](https://github.com/yoltra/yoltra/blob/main/examples/v0/yoltra-in-nextjs/README.md)**            | SSR + App Router compatibility with theme switching                                                                                                                 |

---

## Documentation

- **[Quick Start Guide](https://github.com/yoltra/yoltra/blob/main/docs/en/QUICK_START_GUIDE.md)**
  — Five steps to a working app
- **[@yoltra/core API](https://github.com/yoltra/yoltra/blob/main/packages/core/README.md)** —
  Store, middleware, effects, `When` matchers
- **[@yoltra/react API](https://github.com/yoltra/yoltra/blob/main/packages/react/README.md)** —
  Hooks, Suspense, `createHooks`
- **[Event Queue Architecture](https://github.com/yoltra/yoltra/blob/main/docs/en/design/event-queue-architecture.md)**
  — Technical deep-dive into the pipeline
- **[Library Comparison](https://github.com/yoltra/yoltra/blob/main/docs/en/design/state-management-library-comparison.md)**
  — Architectural comparison with Redux, Zustand, Jotai, and others

---

## Contributing

We welcome contributions! Please read:

- [Contributing Guide](https://github.com/yoltra/yoltra/blob/main/CONTRIBUTING.md)
- [Code of Conduct](https://github.com/yoltra/yoltra/blob/main/CODE_OF_CONDUCT.md)
- [Governance](https://github.com/yoltra/yoltra/blob/main/GOVERNANCE.md)
- [Maintainers](https://github.com/yoltra/yoltra/blob/main/MAINTAINERS.md)
- [Security Policy](https://github.com/yoltra/yoltra/blob/main/SECURITY.md)

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

- APIs are stable and used in production applications
- TypeScript types are strict and comprehensive
- Minor APIs may still evolve before v1.0

Feedback and PRs are welcome.

---

## License

**MIT** — Free to use in commercial and open-source projects.

See [LICENSE](https://github.com/yoltra/yoltra/blob/main/LICENSE) for details.

---

## Community

- **Website:** [yoltra.dev](https://yoltra.dev)
- **Twitter/X:** [@yoltra_dev](https://twitter.com/yoltra_dev)
- **GitHub Discussions:** [Join the conversation](https://github.com/yoltra/yoltra/discussions)
- **Issues:** [Report bugs or request features](https://github.com/yoltra/yoltra/issues)
