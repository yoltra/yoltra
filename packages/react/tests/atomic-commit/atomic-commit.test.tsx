import type { ReactElement, ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import { act } from "react";
import { describe, it, expect } from "vitest";

import { createYoltra } from "../../src/createYoltra";

/**
 * A commit must be atomic across slices *as React observes it*.
 *
 * The store used to assign each slice and fire its change notifications as it went. Both atomic
 * hooks use a change as a bare signal and then re-read the whole store through `getSnapshot`, and
 * `useSyncExternalStore` calls `getSnapshot` **synchronously** when notified — so an event
 * touching two slices notified after the first had committed and the second had not, and a
 * selector spanning both computed from half an event.
 *
 * That was argued for in review and fixed in the store, but never demonstrated from React's side.
 * These are that demonstration. Both assertions fail if notification ever moves back inside the
 * per-slice loop:
 *
 * - no selector result may mix generations, and
 * - no *render* may show a mixed pair.
 *
 * What atomic commit does **not** change is how many notifications an event produces: connector
 * events still fire once per subscribed path, after every slice is written. A selector spanning
 * two slices is therefore recomputed twice for one event — but both times against fully applied
 * state, which is the whole difference. Measured, not assumed: an earlier draft of this file
 * asserted one recomputation per event and failed, which is how the distinction got pinned here
 * rather than remaining a hopeful sentence in a review.
 */

type Side = { gen: number };

/** Two slices that answer the same event, each stamping the generation it saw. */
function build() {
  return createYoltra({
    name: "atomic",
    reducer: {
      left: {
        state: { gen: 0 } as Side,
        when: { keys: [["sync", "tick"]] as const },
        reducer: (_state: Side, event: { payload: number }) => ({ gen: event.payload }),
      },
      right: {
        state: { gen: 0 } as Side,
        when: { keys: [["sync", "tick"]] as const },
        reducer: (_state: Side, event: { payload: number }) => ({ gen: event.payload }),
      },
    },
  } as never) as unknown as {
    store: {
      emit: (c: "sync", t: "tick", p: number) => Promise<unknown>;
      getState: () => { left: Side; right: Side };
      connect: (
        s: { reducer: string; property: string },
        h: () => void,
      ) => () => void;
    };
    StoreProvider: (props: { children: ReactNode }) => ReactElement;
    useAtomicProps: (
      specs: Array<{ reducer: string; property: string }>,
      selector: (s: { left: Side; right: Side }) => unknown,
      isEqual?: (a: unknown, b: unknown) => boolean,
    ) => unknown;
  };
}

describe("a commit is atomic as React observes it", () => {
  it("never lets a selector see one slice of an event without the other", async () => {
    const { store, StoreProvider, useAtomicProps } = build();
    const observed: Array<{ l: number; r: number }> = [];

    function Spanning() {
      const pair = useAtomicProps(
        [
          { reducer: "left", property: "gen" },
          { reducer: "right", property: "gen" },
        ],
        (s) => {
          // Recorded inside the selector, which is where a torn read would appear: this runs
          // during `getSnapshot`, synchronously, on every notification.
          observed.push({ l: s.left.gen, r: s.right.gen });
          return `${s.left.gen}:${s.right.gen}`;
        },
      ) as string;

      return <span data-testid="pair">{pair}</span>;
    }

    render(
      <StoreProvider>
        <Spanning />
      </StoreProvider>,
    );

    for (const gen of [1, 2, 3]) {
      await act(async () => {
        await store.emit("sync", "tick", gen);
      });
    }

    expect(screen.getByTestId("pair").textContent).toBe("3:3");

    // Both slices answer every event with the same generation, so any pair where they disagree is
    // an event observed half-applied. There must not be one.
    const torn = observed.filter((o) => o.l !== o.r);
    expect(torn).toEqual([]);
  });

  it("never renders a mixed pair, however many times the selector runs", async () => {
    const { store, StoreProvider, useAtomicProps } = build();
    const rendered: string[] = [];

    function Spanning() {
      const pair = useAtomicProps(
        [
          { reducer: "left", property: "gen" },
          { reducer: "right", property: "gen" },
        ],
        (s) => `${s.left.gen}:${s.right.gen}`,
      ) as string;

      rendered.push(pair);
      return <span data-testid="pair">{pair}</span>;
    }

    render(
      <StoreProvider>
        <Spanning />
      </StoreProvider>,
    );

    for (const gen of [1, 2, 3]) {
      await act(async () => {
        await store.emit("sync", "tick", gen);
      });
    }

    // Two subscribed paths means two notifications per event, so the selector runs twice — but
    // both against fully applied state, so both produce the same string and React collapses them.
    // A rendered "1:0" would be a half-applied event reaching the DOM.
    const mixed = rendered.filter((r) => {
      const [l, right] = r.split(":");
      return l !== right;
    });
    expect(mixed).toEqual([]);
    expect(screen.getByTestId("pair").textContent).toBe("3:3");
  });

  it("shows every slice already applied to a change subscriber", async () => {
    const { store, StoreProvider } = build();
    const seen: Array<{ l: number; r: number }> = [];

    // Not a hook: the same guarantee at the layer the hooks are built on. Subscribing to one
    // slice and reading another from the handler is the exact shape that used to tear.
    store.connect({ reducer: "left", property: "gen" }, () => {
      const s = store.getState();
      seen.push({ l: s.left.gen, r: s.right.gen });
    });

    render(
      <StoreProvider>
        <span />
      </StoreProvider>,
    );

    await act(async () => {
      await store.emit("sync", "tick", 7);
    });

    expect(seen).toEqual([{ l: 7, r: 7 }]);
  });
});
