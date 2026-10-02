import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { FilterBar } from "../src/components/shared/FilterBar";

/**
 * The status toggles use the store's own word for an event that did not commit.
 *
 * The toggle used to read "Bounced", a word that appears nowhere else: the store, its hooks and
 * its documentation all say "uncommitted", and an event can fail to commit for reasons other than
 * a refusal, such as deduplication.
 */
describe("FilterBar", () => {
  afterEach(cleanup);

  it("labels the toggle for events that did not commit as Uncommitted", () => {
    const onToggle = vi.fn();
    render(<FilterBar value="" onChange={() => {}} showBounced onToggleBounced={onToggle} />);

    const toggle = screen.getByRole("button", { name: "Uncommitted" });
    expect(toggle.getAttribute("title")).toBe("Show events that did not commit");
    expect(screen.queryByText("Bounced")).toBeNull();

    fireEvent.click(toggle);
    expect(onToggle).toHaveBeenCalledOnce();
  });

  it("reports typed filter text, with the default placeholder unless one is given", () => {
    const onChange = vi.fn();
    const { rerender } = render(<FilterBar value="" onChange={onChange} />);

    const input = screen.getByPlaceholderText("Filter by channel::type...");
    fireEvent.change(input, { target: { value: "ui::save" } });
    expect(onChange).toHaveBeenCalledWith("ui::save");

    rerender(<FilterBar value="" onChange={onChange} placeholder="Search" />);
    expect(screen.getByPlaceholderText("Search")).toBeTruthy();
  });

  it("shows a toggle only when its callback is given, and marks the active ones", () => {
    const onCommitted = vi.fn();
    const { rerender } = render(<FilterBar value="" onChange={() => {}} />);
    expect(screen.queryAllByRole("button")).toHaveLength(0);

    rerender(
      <FilterBar
        value=""
        onChange={() => {}}
        showCommitted
        showBounced={false}
        onToggleCommitted={onCommitted}
        onToggleBounced={() => {}}
      />,
    );
    const committed = screen.getByRole("button", { name: "Committed" });
    const uncommitted = screen.getByRole("button", { name: "Uncommitted" });
    expect(committed.className).not.toBe(uncommitted.className);

    fireEvent.click(committed);
    expect(onCommitted).toHaveBeenCalledOnce();

    rerender(<FilterBar value="" onChange={() => {}} showCommitted={false} onToggleCommitted={onCommitted} />);
    expect(screen.getByRole("button", { name: "Committed" }).className).toBe(uncommitted.className);
  });
});
