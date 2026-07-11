import "./App.css";
import { Badge, Callout } from "@yoltra/ds";
import { CodeBlock } from "@yoltra/ds/client";
import { BrandHeader } from "./components/BrandHeader";
import { Counter } from "./components/Counter";

const SNIPPET = `// Subscribe to an exact leaf — re-renders only when counter.value changes.
const value = useAtomicProp("counter", (s) => s.value);
const emit = useEmit();

<button onClick={() => emit("counter", "increment", 1)}>+</button>`;

// No Provider needed — createYoltra's hooks default to the store in state/yoltra.
function App() {
  return (
    <div className="yl-root app-shell">
      <BrandHeader />
      <main className="yl-container app-main">
        <section className="hero">
          <Badge variant="brand">Fine-grained reactivity</Badge>
          <h1 className="hero__title">The counter that re-renders one leaf</h1>
          <p className="hero__lede">
            A minimal Yoltra store. Press the buttons — <code>useAtomicProp</code> subscribes to a single
            state path, so only the count updates while the rest of the tree stays put.
          </p>
        </section>

        <Counter />

        <Callout kind="info">
          <p>
            <strong>Why this matters:</strong> <code>useAtomicProp(&quot;counter&quot;, s =&gt; s.value)</code>{" "}
            subscribes to an exact leaf. No selectors, no memoization — siblings never re-render when the
            count changes.
          </p>
        </Callout>

        <CodeBlock code={SNIPPET} title="counter.ts" language="tsx" />
      </main>
    </div>
  );
}

export default App;
