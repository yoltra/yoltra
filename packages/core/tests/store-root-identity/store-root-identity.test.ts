import { describe, it, expect } from "vitest";

import { createStore } from "../../src/store/Store";
import type { ReducerSpec } from "../../src/types";

/**
 * Root identity across the lifecycle.
 *
 * Every consumer that bails out on reference equality — `useSelector` comparing with `Object.is`,
 * a memo, a devtools snapshot differ — treats an unchanged root as "nothing happened". Mounting
 * and unmounting a slice wrote into the existing root object, so those consumers were told the
 * truth by a manual listener broadcast and contradicted by the state itself.
 */

type Events = { app: { bump: null } };
type Counter = { n: number };

const counterSpec: ReducerSpec<Counter, Events> = {
  state: { n: 0 },
  when: { keys: [["app", "bump"]] } as never,
  reducer: (state) => ({ n: state.n + 1 }),
};

describe("root identity", () => {
  it("changes when a slice is registered", () => {
    const store = createStore<{ a: Counter }, Events>({
      name: "Roots",
      reducer: { a: counterSpec },
    });

    const before = store.getState();
    store.registerReducer("b", counterSpec as never);

    expect(store.getState()).not.toBe(before);
    expect((store.getState() as Record<string, Counter>).b!.n).toBe(0);
  });

  it("changes when a slice is unregistered", () => {
    const store = createStore<{ a: Counter }, Events>({
      name: "Roots",
      reducer: { a: counterSpec },
    });
    const dispose = store.registerReducer("b", counterSpec as never);

    const before = store.getState();
    dispose();

    expect(store.getState()).not.toBe(before);
  });

  it("leaves the untouched slice's reference intact when another is added", () => {
    const store = createStore<{ a: Counter }, Events>({
      name: "Roots",
      reducer: { a: counterSpec },
    });

    const sliceBefore = store.getState().a;
    store.registerReducer("b", counterSpec as never);

    // A new root must not mean a new everything: structural sharing is the whole write path.
    expect(store.getState().a).toBe(sliceBefore);
  });

  it("changes on an ordinary event, as it always did", async () => {
    const store = createStore<{ a: Counter }, Events>({
      name: "Roots",
      reducer: { a: counterSpec },
    });

    const before = store.getState();
    await store.emit("app", "bump", null);

    expect(store.getState()).not.toBe(before);
  });
});

describe("diagnostics for configuration mistakes", () => {
  it("names the slice when its initial state cannot be copied", () => {
    // structuredClone refuses functions, and its DataCloneError says only that something was
    // uncloneable — not which slice, and not which key. In a store assembled from several
    // slices at once that left the developer bisecting their own configuration.
    expect(() =>
      createStore({
        name: "Bad",
        reducer: {
          broken: {
            state: { onSave: () => undefined },
            when: { keys: [["app", "bump"]] },
            reducer: (s: unknown) => s,
          } as never,
        },
      }),
    ).toThrow(/slice "broken"/);
  });

  it("keeps targeting and metadata when middleware is hot-replaced", async () => {
    const seen: string[] = [];
    const store = createStore<{ a: Counter }, Events>({
      name: "Hmr",
      reducer: { a: counterSpec },
    });

    // Spec form: a middleware scoped to one channel. Replacing used to accept only the bare
    // function, so a hot reload silently dropped `when` and the middleware began running on
    // every channel instead of the one it was written for.
    store.replaceMiddleware([
      {
        when: { keys: [["app", "bump"]] },
        middleware: (_s: unknown, e: { type: string }) => {
          seen.push(e.type);
          return true;
        },
      } as never,
    ]);

    await store.emit("app", "bump", null);

    expect(seen).toEqual(["bump"]);
  });
});
