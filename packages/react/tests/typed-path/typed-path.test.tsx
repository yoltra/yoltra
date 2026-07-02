import { describe, it, expect } from "vitest";
import { act, render } from "@testing-library/react";

import type { ReducerSpec } from "@yoltra/core";

import { createYoltra } from "../../src/createYoltra";
import { toDottedPath } from "../../src/utils/path";

describe("toDottedPath", () => {
  it("records nested property + index access as a dotted path", () => {
    expect(toDottedPath((p: any) => p.items[0].title)).toBe("items.0.title");
    expect(toDottedPath((p: any) => p.value)).toBe("value");
    expect(toDottedPath((p: any) => p.a.b.c)).toBe("a.b.c");
  });

  it("returns an empty string for computed (non-path) accessors", () => {
    expect(toDottedPath(() => 5)).toBe("");
  });
});

type EM = { board: { rename: { id: string; title: string } } };
type BoardState = { items: Array<{ id: string; title: string }>; filter: { q: string } };

const boardSpec: ReducerSpec<BoardState, EM> = {
  state: {
    items: [
      { id: "a", title: "A" },
      { id: "b", title: "B" },
    ],
    filter: { q: "" },
  },
  events: [["board", "rename"]],
  reducer(state, event) {
    if (event.type === "rename") {
      const { id, title } = event.payload as { id: string; title: string };
      return { ...state, items: state.items.map((it) => (it.id === id ? { ...it, title } : it)) };
    }
    return state;
  },
};

describe("useAtomicProp typed accessor form (C4)", () => {
  it("subscribes to the accessor path and re-renders only when that exact leaf changes", async () => {
    const { store, useAtomicProp } = createYoltra({ name: "Board", reducer: { board: boardSpec } });

    let renders = 0;
    function ItemTitle() {
      renders++;
      // `title` is inferred as string; `p` autocompletes the BoardState shape.
      const title = useAtomicProp("board", (p) => p.items[0].title);
      return <span data-testid="t">{title}</span>;
    }

    const { getByTestId } = render(<ItemTitle />);
    expect(getByTestId("t").textContent).toBe("A");
    const rendersAfterMount = renders;

    // Change items[1].title — a different leaf — must NOT re-render ItemTitle.
    await act(async () => {
      await store.emit("board", "rename", { id: "b", title: "B2" });
    });
    expect(renders).toBe(rendersAfterMount);
    expect(getByTestId("t").textContent).toBe("A");

    // Change items[0].title — the subscribed leaf — must re-render.
    await act(async () => {
      await store.emit("board", "rename", { id: "a", title: "A2" });
    });
    expect(getByTestId("t").textContent).toBe("A2");
    expect(renders).toBeGreaterThan(rendersAfterMount);
  });
});
