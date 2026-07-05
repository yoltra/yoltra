import { describe, it, expect, vi } from "vitest";
import { act, render } from "@testing-library/react";

import type { ReducerSpec } from "@yoltra/core";

import { createYoltra } from "../../src/createYoltra";
import { specsSignature, toDottedPath } from "../../src/utils/path";

describe("specsSignature (RX-8)", () => {
  it("does not collide when delimiter chars appear in a reducer or path", () => {
    // A naive `${reducer}:${prop}` join collapsed these to the same string;
    // length-prefixing keeps them distinct.
    expect(specsSignature([{ reducer: "a", property: "b:c" }])).not.toBe(
      specsSignature([{ reducer: "a:b", property: "c" }]),
    );
    // Array property vs a comma-joined string stay distinct.
    expect(specsSignature([{ reducer: "a", property: ["b", "c"] }])).not.toBe(
      specsSignature([{ reducer: "a", property: "b,c" }]),
    );
    // Array length is encoded, so ["x"] and ["x", ""] differ.
    expect(specsSignature([{ reducer: "a", property: ["x"] }])).not.toBe(
      specsSignature([{ reducer: "a", property: ["x", ""] }]),
    );
  });

  it("is stable for identical inputs", () => {
    const build = () =>
      specsSignature([
        { reducer: "todos", property: "items.0.title" },
        { reducer: "ui", property: ["a", "b"] },
      ]);
    expect(build()).toBe(build());
  });
});

describe("toDottedPath", () => {
  it("records nested property + index access as a dotted path", () => {
    expect(toDottedPath((p: any) => p.items[0].title)).toBe("items.0.title");
    expect(toDottedPath((p: any) => p.value)).toBe("value");
    expect(toDottedPath((p: any) => p.a.b.c)).toBe("a.b.c");
  });

  it("returns an empty string for computed (non-path) accessors and warns in dev (RX-3)", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(toDottedPath(() => 5)).toBe("");
    // An empty path silently subscribes to the whole slice — surface it in dev.
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("subscribe to the"));
    warn.mockRestore();
  });

  it("throws a clear error when the accessor calls a method (RX-3)", () => {
    // `p => p.items.map(...)` calls a function inside the recording proxy, which
    // would otherwise throw an opaque "x is not a function".
    expect(() => toDottedPath((p: any) => p.items.map((x: any) => x.id))).toThrow(
      /member chain|method/i,
    );
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
