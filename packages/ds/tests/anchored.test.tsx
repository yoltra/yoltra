import { act, fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";

import { ContextMenu, Menu, MenuItem, MenuSeparator, Popover } from "../src/overlay/Popover";
import { Tooltip } from "../src/overlay/Tooltip";

/**
 * The anchored tier: what it announces, and how it behaves under the keyboard.
 *
 * @remarks
 * Position is *not* asserted here. jsdom runs no layout, so every rect is zero and every
 * coordinate resolves to the same place regardless of the maths — an assertion on `left` would
 * pass whatever `resolvePlacement` did. That logic is checked against real rectangles in
 * `placement.test.ts`; what is left for this file is the wiring, which is where the accessibility
 * failures live.
 */

function PopoverFixture({ onCloseSpy }: { onCloseSpy?: () => void } = {}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Popover
        open={open}
        onClose={() => {
          setOpen(false);
          onCloseSpy?.();
        }}
        label="Telemetry settings"
        trigger={(props) => (
          <button type="button" {...props} onClick={() => setOpen((v) => !v)}>
            Settings
          </button>
        )}
      >
        <button type="button" data-testid="inside">
          inside
        </button>
      </Popover>
      <button type="button" data-testid="elsewhere">
        elsewhere
      </button>
    </>
  );
}

describe("Popover", () => {
  it("wires the trigger to the surface, and only while it is open", () => {
    render(<PopoverFixture />);
    const trigger = screen.getByText("Settings");

    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    expect(trigger.getAttribute("aria-haspopup")).toBe("dialog");
    // No surface exists yet, so pointing at one would be a dangling reference.
    expect(trigger.getAttribute("aria-controls")).toBeNull();

    fireEvent.click(trigger);
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    expect(document.getElementById(trigger.getAttribute("aria-controls")!)).toBe(
      screen.getByRole("dialog"),
    );
  });

  it("names the surface, which has no header to name it", () => {
    render(<PopoverFixture />);
    fireEvent.click(screen.getByText("Settings"));
    expect(screen.getByRole("dialog").getAttribute("aria-label")).toBe("Telemetry settings");
  });

  it("moves focus into the surface and hands it back on close", () => {
    render(<PopoverFixture />);
    const trigger = screen.getByText("Settings");
    trigger.focus();

    fireEvent.click(trigger);
    expect(document.activeElement).toBe(screen.getByTestId("inside"));

    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });

  it("does not lock page scrolling, being non-modal", () => {
    // The difference from Dialog that matters: a popover sits beside the page, not over it.
    render(<PopoverFixture />);
    fireEvent.click(screen.getByText("Settings"));
    expect(document.body.style.overflow).toBe("");
  });

  it("treats a press on the trigger as a toggle, not a dismissal and a re-open", () => {
    const onCloseSpy = vi.fn();
    render(<PopoverFixture onCloseSpy={onCloseSpy} />);
    const trigger = screen.getByText("Settings");

    fireEvent.click(trigger);
    // The trigger counts as inside the layer, so the outside-press listener must ignore it.
    fireEvent.pointerDown(trigger);
    expect(onCloseSpy).not.toHaveBeenCalled();
  });

  it("closes on a press outside itself", () => {
    render(<PopoverFixture />);
    fireEvent.click(screen.getByText("Settings"));
    fireEvent.pointerDown(screen.getByTestId("elsewhere"));
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("closes when focus leaves for something that is neither it nor the trigger", () => {
    render(<PopoverFixture />);
    fireEvent.click(screen.getByText("Settings"));
    const surface = screen.getByRole("dialog");

    fireEvent.blur(surface, { relatedTarget: screen.getByTestId("elsewhere") });
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("stays open when focus moves within itself", () => {
    render(<PopoverFixture />);
    fireEvent.click(screen.getByText("Settings"));
    const surface = screen.getByRole("dialog");

    fireEvent.blur(surface, { relatedTarget: screen.getByTestId("inside") });
    expect(screen.queryByRole("dialog")).not.toBeNull();
  });
});

describe("staying anchored", () => {
  /**
   * jsdom reports every rectangle as zero, so the only way to exercise repositioning is to say
   * what the rectangles are. The arithmetic itself is `placement.test.ts`'s job; what is checked
   * here is narrower and not covered there — that a scroll causes a re-measurement at all.
   */
  function stubRects(anchor: { x: number; y: number }) {
    return vi
      .spyOn(HTMLElement.prototype, "getBoundingClientRect")
      .mockImplementation(function (this: HTMLElement) {
        const box = this.classList.contains("yl-popover")
          ? { x: 0, y: 0, width: 200, height: 100 }
          : { x: anchor.x, y: anchor.y, width: 40, height: 20 };
        return { ...box, top: box.y, left: box.x, right: 0, bottom: 0, toJSON: () => box } as DOMRect;
      });
  }

  it("re-measures when the page scrolls under the anchor", () => {
    const anchor = { x: 100, y: 100 };
    const rects = stubRects(anchor);
    try {
      render(<PopoverFixture />);
      fireEvent.click(screen.getByText("Settings"));

      const surface = screen.getByRole("dialog");
      // bottom-start, 8px offset: directly under the anchor's lower edge.
      expect(surface.style.top).toBe(`${100 + 20 + 8}px`);
      expect(surface.style.left).toBe("100px");

      // The anchor has moved; nothing re-rendered, so only the scroll listener can notice.
      anchor.y = 300;
      act(() => {
        fireEvent.scroll(window);
      });
      expect(surface.style.top).toBe(`${300 + 20 + 8}px`);
    } finally {
      rects.mockRestore();
    }
  });

  it("keeps the surface hidden until it has been measured", () => {
    // It has to be in the DOM to have a size, so there is one frame where it exists at no
    // particular position. Showing that frame is a flash in the top-left corner.
    const rects = stubRects({ x: 100, y: 100 });
    try {
      render(<PopoverFixture />);
      fireEvent.click(screen.getByText("Settings"));
      // Measured by the time the commit is visible, so `visibility` is back to the default.
      expect(screen.getByRole("dialog").style.visibility).toBe("");
    } finally {
      rects.mockRestore();
    }
  });
});

function MenuFixture({ onSelect }: { onSelect?: (which: string) => void } = {}) {
  const [open, setOpen] = useState(false);
  return (
    <Menu
      open={open}
      onClose={() => setOpen(false)}
      label="Satellite actions"
      trigger={(props) => (
        <button type="button" {...props} onClick={() => setOpen((v) => !v)}>
          Actions
        </button>
      )}
    >
      <MenuItem onSelect={() => onSelect?.("deploy")}>Deploy panels</MenuItem>
      <MenuItem onSelect={() => onSelect?.("boost")} disabled>
        Boost orbit
      </MenuItem>
      <MenuSeparator />
      <MenuItem onSelect={() => onSelect?.("scrap")}>Decommission</MenuItem>
    </Menu>
  );
}

const items = () => screen.getAllByRole("menuitem");

describe("Menu", () => {
  it("is announced as a menu of menu items, named", () => {
    render(<MenuFixture />);
    fireEvent.click(screen.getByText("Actions"));

    expect(screen.getByRole("menu").getAttribute("aria-label")).toBe("Satellite actions");
    expect(items()).toHaveLength(3);
    expect(screen.getByText("Actions").getAttribute("aria-haspopup")).toBe("menu");
  });

  it("focuses the first item on open", () => {
    render(<MenuFixture />);
    fireEvent.click(screen.getByText("Actions"));
    expect(document.activeElement).toBe(items()[0]);
  });

  it("roves focus with the arrow keys, wrapping at both ends", () => {
    render(<MenuFixture />);
    fireEvent.click(screen.getByText("Actions"));
    const menu = screen.getByRole("menu");
    const [first, second, third] = items();

    fireEvent.keyDown(menu, { key: "ArrowDown" });
    expect(document.activeElement).toBe(second);

    fireEvent.keyDown(menu, { key: "ArrowDown" });
    expect(document.activeElement).toBe(third);

    fireEvent.keyDown(menu, { key: "ArrowDown" });
    expect(document.activeElement).toBe(first);

    fireEvent.keyDown(menu, { key: "ArrowUp" });
    expect(document.activeElement).toBe(third);
  });

  it("jumps to the ends with Home and End", () => {
    render(<MenuFixture />);
    fireEvent.click(screen.getByText("Actions"));
    const menu = screen.getByRole("menu");

    fireEvent.keyDown(menu, { key: "End" });
    expect(document.activeElement).toBe(items()[2]);

    fireEvent.keyDown(menu, { key: "Home" });
    expect(document.activeElement).toBe(items()[0]);
  });

  it("keeps a disabled item reachable by keyboard but inert on activation", () => {
    // aria-disabled rather than the disabled attribute: a keyboard user should be able to find
    // out that the action exists, which `disabled` would prevent by removing it from the tree.
    const onSelect = vi.fn();
    render(<MenuFixture onSelect={onSelect} />);
    fireEvent.click(screen.getByText("Actions"));

    const disabled = items()[1]!;
    expect(disabled.getAttribute("aria-disabled")).toBe("true");
    expect(disabled.hasAttribute("disabled")).toBe(false);

    fireEvent.keyDown(screen.getByRole("menu"), { key: "ArrowDown" });
    expect(document.activeElement).toBe(disabled);

    fireEvent.click(disabled);
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("runs an enabled item and lets the caller close", () => {
    const onSelect = vi.fn();
    render(<MenuFixture onSelect={onSelect} />);
    fireEvent.click(screen.getByText("Actions"));

    fireEvent.click(items()[0]!);
    expect(onSelect).toHaveBeenCalledWith("deploy");
  });

  it("closes on Tab, which then continues past the trigger", () => {
    render(<MenuFixture />);
    fireEvent.click(screen.getByText("Actions"));
    fireEvent.keyDown(screen.getByRole("menu"), { key: "Tab" });
    expect(screen.queryByRole("menu")).toBeNull();
  });

  it("ignores keys it has no opinion about", () => {
    render(<MenuFixture />);
    fireEvent.click(screen.getByText("Actions"));
    const first = items()[0]!;

    fireEvent.keyDown(screen.getByRole("menu"), { key: "b" });
    expect(document.activeElement).toBe(first);
    expect(screen.queryByRole("menu")).not.toBeNull();
  });
});

function ContextMenuFixture() {
  const [at, setAt] = useState<{ x: number; y: number } | null>(null);
  return (
    <>
      <div
        data-testid="row"
        onContextMenu={(e) => {
          e.preventDefault();
          setAt({ x: e.clientX, y: e.clientY });
        }}
      >
        row
      </div>
      <ContextMenu at={at} onClose={() => setAt(null)} label="Row actions">
        <MenuItem onSelect={() => undefined}>Rename</MenuItem>
        <MenuItem onSelect={() => undefined}>Delete</MenuItem>
      </ContextMenu>
    </>
  );
}

describe("ContextMenu", () => {
  it("is closed until a point is given", () => {
    render(<ContextMenuFixture />);
    expect(screen.queryByRole("menu")).toBeNull();
  });

  it("opens at the pointer position and navigates like a menu", () => {
    render(<ContextMenuFixture />);
    fireEvent.contextMenu(screen.getByTestId("row"), { clientX: 120, clientY: 240 });

    const menu = screen.getByRole("menu");
    expect(menu.getAttribute("aria-label")).toBe("Row actions");
    expect(document.activeElement).toBe(screen.getAllByRole("menuitem")[0]);

    fireEvent.keyDown(menu, { key: "ArrowDown" });
    expect(document.activeElement).toBe(screen.getAllByRole("menuitem")[1]);
  });

  it("closes on Escape", () => {
    render(<ContextMenuFixture />);
    fireEvent.contextMenu(screen.getByTestId("row"), { clientX: 10, clientY: 10 });
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("menu")).toBeNull();
  });
});

function TooltipFixture({ delayMs }: { delayMs?: number } = {}) {
  return (
    <Tooltip content="Deploy the solar array" delayMs={delayMs}>
      {(props) => (
        <button type="button" {...props}>
          Deploy
        </button>
      )}
    </Tooltip>
  );
}

describe("Tooltip", () => {
  it("describes rather than labels its trigger", () => {
    // aria-label would replace the button's name; a tooltip supplements it.
    render(<TooltipFixture />);
    const trigger = screen.getByRole("button", { name: "Deploy" });
    expect(trigger.getAttribute("aria-label")).toBeNull();

    fireEvent.focus(trigger);
    const tip = screen.getByRole("tooltip");
    expect(trigger.getAttribute("aria-describedby")).toBe(tip.id);
    expect(tip.textContent).toBe("Deploy the solar array");
  });

  it("appears immediately on focus, skipping the pointer delay", () => {
    // Arriving by keyboard is deliberate in a way that passing over with a mouse is not.
    render(<TooltipFixture delayMs={10_000} />);
    fireEvent.focus(screen.getByRole("button"));
    expect(screen.getByRole("tooltip")).toBeDefined();
  });

  it("waits out the delay on hover", () => {
    vi.useFakeTimers();
    try {
      render(<TooltipFixture delayMs={400} />);
      fireEvent.pointerEnter(screen.getByRole("button"));
      expect(screen.queryByRole("tooltip")).toBeNull();

      // Inside act: the timer's setState lands outside React's batching otherwise, and the
      // re-render it schedules never flushes before the assertion.
      act(() => vi.advanceTimersByTime(400));
      expect(screen.getByRole("tooltip")).toBeDefined();
    } finally {
      vi.useRealTimers();
    }
  });

  it("cancels a pending delay when the pointer leaves first", () => {
    vi.useFakeTimers();
    try {
      render(<TooltipFixture delayMs={400} />);
      const trigger = screen.getByRole("button");
      fireEvent.pointerEnter(trigger);
      fireEvent.pointerLeave(trigger);

      act(() => vi.advanceTimersByTime(1000));
      expect(screen.queryByRole("tooltip")).toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });

  it("hides on blur and on Escape", () => {
    render(<TooltipFixture />);
    const trigger = screen.getByRole("button");

    fireEvent.focus(trigger);
    fireEvent.blur(trigger);
    expect(screen.queryByRole("tooltip")).toBeNull();

    fireEvent.focus(trigger);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("tooltip")).toBeNull();
  });

  it("never takes focus away from the element it describes", () => {
    render(<TooltipFixture />);
    const trigger = screen.getByRole("button");
    // A real `.focus()` here, not a synthetic event: the question is whether showing the tooltip
    // moves focus off the element that actually has it. Wrapped in act because the native focus
    // dispatches through React and opens the tooltip.
    act(() => trigger.focus());

    expect(screen.getByRole("tooltip")).toBeDefined();
    expect(document.activeElement).toBe(trigger);
  });
});
