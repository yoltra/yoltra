import { RuleTester } from "eslint";
import { describe, it } from "vitest";

// A plain ESM rule module with no build step: it is consumed by ESLint's flat config, which is
// JavaScript. `allowJs` in this package's tsconfig lets the import be resolved and inferred
// rather than silenced — the `@ts-expect-error` that used to sit here also hid every misuse of
// what it imported.
import { noGetStateInRender } from "../eslint/no-getstate-in-render.mjs";

/**
 * The one rule that survived the planned ESLint plugin.
 *
 * @remarks
 * `getState()` subscribes to nothing. In a callback that is the point; in a render body it means
 * the component renders once with the value and never again — it looks like it works until the
 * state moves and the screen does not. The line between the two is which function the read is in,
 * so that is what these cases cover from both sides.
 */

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: "module",
    parserOptions: { ecmaFeatures: { jsx: true } },
  },
});

describe("no-getstate-in-render", () => {
  it("accepts callbacks and rejects render bodies", () => {
    ruleTester.run("no-getstate-in-render", noGetStateInRender, {
      valid: [
        {
          name: "inside an event handler, which is when the value is wanted",
          code: `
            function Counter() {
              const store = useStore();
              return <button onClick={() => console.log(store.getState())}>go</button>;
            }
          `,
        },
        {
          name: "inside an effect",
          code: `
            function Counter() {
              const store = useStore();
              useEffect(() => { report(store.getState()); }, [store]);
              return null;
            }
          `,
        },
        {
          name: "inside a named handler declared in the component",
          code: `
            function Counter() {
              const store = useStore();
              const onSave = () => save(store.getState());
              return <button onClick={onSave}>save</button>;
            }
          `,
        },
        {
          name: "a store that did not come from useStore",
          code: `
            function Counter({ store }) {
              return <span>{store.getState().value}</span>;
            }
          `,
        },
        {
          name: "getState on something unrelated",
          code: `
            function Counter() {
              const machine = useMachine();
              return <span>{machine.getState()}</span>;
            }
          `,
        },
        {
          name: "outside a component entirely",
          code: `
            const store = createStore({});
            export const snapshot = () => store.getState();
          `,
        },
      ],

      invalid: [
        {
          name: "read straight into the rendered output",
          code: `
            function Counter() {
              const store = useStore();
              return <span>{store.getState().counter.value}</span>;
            }
          `,
          errors: [{ messageId: "inRender" }],
        },
        {
          name: "chained off the hook call",
          code: `
            function Counter() {
              return <span>{useStore().getState().counter.value}</span>;
            }
          `,
          errors: [{ messageId: "inRender" }],
        },
        {
          name: "an arrow component, which is how most of them are written",
          code: `
            const Counter = () => {
              const store = useStore();
              const value = store.getState().counter.value;
              return <span>{value}</span>;
            };
          `,
          errors: [{ messageId: "inRender" }],
        },
        {
          name: "a custom hook, which renders on its caller's behalf",
          code: `
            function useTotal() {
              const store = useStore();
              return store.getState().cart.total;
            }
          `,
          errors: [{ messageId: "inRender" }],
        },
        {
          name: "nested in a block but still in the render body",
          code: `
            function Counter({ verbose }) {
              const store = useStore();
              if (verbose) {
                const all = store.getState();
                return <pre>{JSON.stringify(all)}</pre>;
              }
              return null;
            }
          `,
          errors: [{ messageId: "inRender" }],
        },
      ],
    });
  });
});
