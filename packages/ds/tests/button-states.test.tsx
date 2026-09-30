import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { Button, IconButton } from "../src/index";

/**
 * The states a button can be in, beyond enabled and disabled.
 *
 * @remarks
 * `loading` and `pressed` are easy to implement in a way that looks right and announces nothing,
 * which is why these assert the attributes rather than the classes.
 */

afterEach(cleanup);

describe("loading", () => {
  it("announces itself as busy", () => {
    render(<Button loading>Save</Button>);
    expect(screen.getByRole("button").getAttribute("aria-busy")).toBe("true");
  });

  it("keeps its accessible name while busy", () => {
    render(<Button loading>Save</Button>);
    // The label stays in the layout at zero opacity. `visibility: hidden` or `display: none` would
    // hold the width and take the name away, leaving a busy button announced as "button".
    expect(screen.getByRole("button", { name: "Save" })).toBeDefined();
  });

  it("keeps its place in the tab order rather than using disabled", () => {
    render(<Button loading>Save</Button>);
    const button = screen.getByRole("button");
    // `disabled` would drop it out of the tab order mid-action and throw the reader somewhere else.
    expect(button.hasAttribute("disabled")).toBe(false);
    expect(button.getAttribute("aria-disabled")).toBe("true");
  });

  it("swallows clicks", () => {
    const onClick = vi.fn();
    render(
      <Button loading onClick={onClick}>
        Save
      </Button>,
    );
    fireEvent.click(screen.getByRole("button"));
    expect(onClick).not.toHaveBeenCalled();
  });

  it("passes clicks through when it is not loading", () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Save</Button>);
    fireEvent.click(screen.getByRole("button"));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("says nothing about busyness when the prop is absent", () => {
    render(<Button>Save</Button>);
    const button = screen.getByRole("button");
    expect(button.hasAttribute("aria-busy")).toBe(false);
    expect(button.hasAttribute("aria-disabled")).toBe(false);
  });

  it("works the same on an icon button", () => {
    const onClick = vi.fn();
    render(
      <IconButton label="Copy" loading onClick={onClick}>
        x
      </IconButton>,
    );
    const button = screen.getByRole("button", { name: "Copy" });
    expect(button.getAttribute("aria-busy")).toBe("true");
    fireEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });
});

describe("pressed", () => {
  it("reports a toggle's state", () => {
    render(<Button pressed>Bold</Button>);
    expect(screen.getByRole("button", { pressed: true })).toBeDefined();
  });

  it("reports the off state, which is not the same as having no state", () => {
    render(<Button pressed={false}>Bold</Button>);
    expect(screen.getByRole("button", { pressed: false })).toBeDefined();
  });

  it("omits the attribute entirely for a button that is not a toggle", () => {
    render(<Button>Save</Button>);
    // `aria-pressed="false"` on an action button reports a state that does not exist.
    expect(screen.getByRole("button").hasAttribute("aria-pressed")).toBe(false);
  });
});

describe("variants and sizes", () => {
  it("carries the danger variant", () => {
    render(<Button variant="danger">Delete</Button>);
    expect(screen.getByRole("button").className).toContain("yl-btn--danger");
  });

  it("carries the touch size", () => {
    render(<Button size="lg">Sell</Button>);
    expect(screen.getByRole("button").className).toContain("yl-btn--lg");
  });

  it("adds no size class for the default, so the base rule is the default", () => {
    render(<Button>Save</Button>);
    const cls = screen.getByRole("button").className;
    expect(cls).toContain("yl-btn--primary");
    expect(cls).not.toContain("yl-btn--md");
  });
});
