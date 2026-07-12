import { Badge, Callout } from "@yoltra/ds";
import { CodeBlock } from "@yoltra/ds/client";

const SNIPPET = `// The toggle just emits an event — the theme slice reduces it,
// and only subscribers of theme.resolved re-render.
const emit = useEmit();
const resolved = useAtomicProp("theme", (s) => s.resolved);

emit("theme", "set", { theme: resolved === "dark" ? "light" : "dark" });`;

export const MainContent = () => {
  return (
    <main className="yl-container app-main">
      <section className="hero">
        <Badge variant="brand">Event-sourced state</Badge>
        <h1 className="hero__title">Switch themes, powered by Yoltra</h1>
        <p className="hero__lede">
          Click the 🌙 / 🌞 toggle in the header. The change is an atomic property update handled by{" "}
          <strong>Yoltra</strong> — the theme lives in a store slice, and components subscribe to the
          exact <code>theme.resolved</code> leaf they need.
        </p>
      </section>

      <Callout kind="info">
        <p>
          This same store drives both the SCSS <code>theme-*</code> class and the design-system{" "}
          <code>data-theme</code> attribute — one source of truth, two consumers.
        </p>
      </Callout>

      <CodeBlock code={SNIPPET} title="theme toggle" language="tsx" />
    </main>
  );
};
