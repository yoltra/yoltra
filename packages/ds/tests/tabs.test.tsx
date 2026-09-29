import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { Tabs } from "../src/primitives/Tabs/Tabs";

/**
 * The ARIA tabs pattern, asserted.
 *
 * @remarks
 * The component set the four roles and `aria-selected` for four releases and implemented none of
 * the keyboard behaviour, which nothing here noticed because nothing here asked. Everything was
 * reachable with Tab, so it passed every assertion that existed and was still not the pattern a
 * screen reader user expects.
 *
 * These are behavioural rather than structural on purpose: `aria-controls` pointing at an id that
 * exists is worth little if arrowing to the tab never happens.
 */

afterEach(cleanup);

const ITEMS = [
  { id: "one", label: "One", content: <p>First</p> },
  { id: "two", label: "Two", content: <p>Second</p> },
  { id: "three", label: "Three", content: <p>Third</p> },
];

const tabs = () => screen.getAllByRole("tab");
const selected = () => screen.getByRole("tab", { selected: true });

describe("the tab list is one tab stop", () => {
  it("gives the selected tab a tabIndex of 0 and the rest -1", () => {
    render(<Tabs items={ITEMS} />);
    expect(tabs().map((t) => t.getAttribute("tabindex"))).toEqual(["0", "-1", "-1"]);
  });

  it("moves the tab stop with the selection", () => {
    render(<Tabs items={ITEMS} defaultId="three" />);
    expect(tabs().map((t) => t.getAttribute("tabindex"))).toEqual(["-1", "-1", "0"]);
  });
});

describe("arrow keys move between tabs", () => {
  it("advances with ArrowRight and wraps at the end", () => {
    render(<Tabs items={ITEMS} />);
    const list = screen.getByRole("tablist");

    fireEvent.keyDown(list, { key: "ArrowRight" });
    expect(selected().textContent).toBe("Two");

    fireEvent.keyDown(list, { key: "ArrowRight" });
    expect(selected().textContent).toBe("Three");

    // Wrapping rather than stopping: a set of three should not have a dead end.
    fireEvent.keyDown(list, { key: "ArrowRight" });
    expect(selected().textContent).toBe("One");
  });

  it("retreats with ArrowLeft and wraps at the start", () => {
    render(<Tabs items={ITEMS} />);
    const list = screen.getByRole("tablist");

    fireEvent.keyDown(list, { key: "ArrowLeft" });
    expect(selected().textContent).toBe("Three");
  });

  it("jumps to the ends with Home and End", () => {
    render(<Tabs items={ITEMS} defaultId="two" />);
    const list = screen.getByRole("tablist");

    fireEvent.keyDown(list, { key: "End" });
    expect(selected().textContent).toBe("Three");

    fireEvent.keyDown(list, { key: "Home" });
    expect(selected().textContent).toBe("One");
  });

  it("moves focus with the selection, not only the attribute", () => {
    render(<Tabs items={ITEMS} />);
    fireEvent.keyDown(screen.getByRole("tablist"), { key: "ArrowRight" });
    // Without this the arrow keys would change what is selected and leave the reader's focus
    // behind on a tab that is no longer current.
    expect(document.activeElement).toBe(screen.getByRole("tab", { name: "Two" }));
  });

  it("ignores keys it does not handle, so typing still reaches the page", () => {
    render(<Tabs items={ITEMS} />);
    const list = screen.getByRole("tablist");
    fireEvent.keyDown(list, { key: "a" });
    fireEvent.keyDown(list, { key: "ArrowDown" });
    expect(selected().textContent).toBe("One");
  });
});

describe("arrow keys follow the writing direction", () => {
  it("inverts in a right-to-left container", () => {
    // Read from the computed direction rather than a prop, so a container that sets `dir` further
    // up still gets arrows that point the way the text runs.
    const spy = vi.spyOn(window, "getComputedStyle").mockReturnValue({
      direction: "rtl",
    } as CSSStyleDeclaration);
    try {
      render(<Tabs items={ITEMS} />);
      fireEvent.keyDown(screen.getByRole("tablist"), { key: "ArrowLeft" });
      expect(selected().textContent).toBe("Two");
    } finally {
      spy.mockRestore();
    }
  });
});

describe("each tab is tied to its panel", () => {
  it("points at the panel with aria-controls, and the panel back with aria-labelledby", () => {
    render(<Tabs items={ITEMS} />);
    const panel = screen.getByRole("tabpanel");
    const tab = selected();

    expect(tab.getAttribute("aria-controls")).toBe(panel.id);
    expect(panel.getAttribute("aria-labelledby")).toBe(tab.id);
    expect(tab.id).not.toBe("");
    expect(panel.id).not.toBe("");
  });

  it("keeps the wiring correct after the selection moves", () => {
    render(<Tabs items={ITEMS} />);
    fireEvent.keyDown(screen.getByRole("tablist"), { key: "ArrowRight" });

    const panel = screen.getByRole("tabpanel");
    expect(panel.getAttribute("aria-labelledby")).toBe(selected().id);
    expect(selected().getAttribute("aria-controls")).toBe(panel.id);
    expect(panel.textContent).toBe("Second");
  });

  it("makes the panel focusable, so Tab from the tab reaches the content", () => {
    render(<Tabs items={ITEMS} />);
    expect(screen.getByRole("tabpanel").getAttribute("tabindex")).toBe("0");
  });

  it("gives two instances on one page distinct ids", () => {
    render(
      <>
        <Tabs items={ITEMS} />
        <Tabs items={ITEMS} />
      </>,
    );
    const ids = screen.getAllByRole("tabpanel").map((p) => p.id);
    expect(new Set(ids).size).toBe(2);
  });
});

describe("manual activation", () => {
  it("moves focus without selecting", () => {
    render(<Tabs items={ITEMS} activation="manual" />);
    fireEvent.keyDown(screen.getByRole("tablist"), { key: "ArrowRight" });

    expect(document.activeElement).toBe(screen.getByRole("tab", { name: "Two" }));
    // The point of the mode: arrowing past an expensive panel must not render it.
    expect(selected().textContent).toBe("One");
    expect(screen.getByRole("tabpanel").textContent).toBe("First");
  });

  it("selects on click", () => {
    render(<Tabs items={ITEMS} activation="manual" />);
    fireEvent.click(screen.getByRole("tab", { name: "Three" }));
    expect(selected().textContent).toBe("Three");
  });
});

describe("degenerate input", () => {
  it("renders a list and no panel when there are no items", () => {
    render(<Tabs items={[]} />);
    expect(screen.getByRole("tablist")).toBeDefined();
    expect(screen.queryByRole("tabpanel")).toBeNull();
  });

  it("falls back to the first tab when defaultId names nothing", () => {
    render(<Tabs items={ITEMS} defaultId="nope" />);
    expect(selected().textContent).toBe("One");
  });
});
