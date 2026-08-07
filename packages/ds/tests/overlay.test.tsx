import { act, fireEvent, render, screen } from "@testing-library/react";
import { useRef, useState } from "react";
import { afterEach, describe, expect, it } from "vitest";

import { Portal } from "../src/overlay/Portal";
import { Dialog, Drawer } from "../src/overlay/Modal";

/**
 * The overlay tier, which is the part of this package where a mistake is invisible.
 *
 * @remarks
 * A dialog that renders is not a dialog that works: the failures that matter are focus escaping
 * to the page behind it, focus never coming back, Escape closing two layers at once, and the
 * body left unscrollable after the last one closes. None of those show up in a snapshot, so they
 * are what this file asserts.
 */

afterEach(() => {
  // Every test opens something; a leaked lock would silently pass the next one.
  document.body.style.overflow = "";
  document.body.style.paddingRight = "";
});

describe("Portal", () => {
  it("renders into document.body rather than in place", () => {
    const { container } = render(
      <div data-testid="host">
        <Portal>
          <span data-testid="content">out</span>
        </Portal>
      </div>,
    );

    const content = screen.getByTestId("content");
    expect(content).toBeDefined();
    expect(container.querySelector("[data-testid='content']")).toBeNull();
    expect(content.closest("[data-yl-portal]")).not.toBeNull();
  });

  it("removes its host node on unmount, so overlays do not accumulate", () => {
    const { unmount } = render(
      <Portal>
        <span>x</span>
      </Portal>,
    );
    expect(document.querySelectorAll("[data-yl-portal]").length).toBe(1);

    unmount();
    expect(document.querySelectorAll("[data-yl-portal]").length).toBe(0);
  });

  it("mounts into a supplied container", () => {
    const host = document.createElement("section");
    document.body.appendChild(host);

    render(
      <Portal container={host}>
        <span data-testid="scoped">x</span>
      </Portal>,
    );

    expect(host.contains(screen.getByTestId("scoped"))).toBe(true);
    host.remove();
  });
});

function ControlledDialog(props: { onClose?: () => void; initialOpen?: boolean } = {}) {
  const [open, setOpen] = useState(props.initialOpen ?? true);
  return (
    <>
      <button type="button" data-testid="opener" onClick={() => setOpen(true)}>
        open
      </button>
      <Dialog
        open={open}
        onClose={() => {
          setOpen(false);
          props.onClose?.();
        }}
        title="Decommission satellite"
        description="This cannot be undone."
        footer={
          <button type="button" data-testid="confirm">
            Confirm
          </button>
        }
      >
        <input data-testid="field" />
      </Dialog>
    </>
  );
}

describe("Dialog", () => {
  it("is announced as a modal dialog, named and described by its own header", () => {
    render(<ControlledDialog />);

    const dialog = screen.getByRole("dialog");
    expect(dialog.getAttribute("aria-modal")).toBe("true");
    // Resolved through the ids rather than trusting they were emitted: a labelledby pointing at
    // nothing is the same to a screen reader as no label at all.
    const labelId = dialog.getAttribute("aria-labelledby")!;
    const describedId = dialog.getAttribute("aria-describedby")!;
    expect(document.getElementById(labelId)?.textContent).toBe("Decommission satellite");
    expect(document.getElementById(describedId)?.textContent).toBe("This cannot be undone.");
  });

  it("renders nothing at all while closed", () => {
    render(<ControlledDialog initialOpen={false} />);
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(document.querySelectorAll("[data-yl-portal]").length).toBe(0);
  });

  it("moves focus into the surface on open", () => {
    render(<ControlledDialog />);
    // The close button is the first focusable element in the header.
    expect(document.activeElement?.getAttribute("aria-label")).toBe("Close");
  });

  it("honours initialFocusRef over the first focusable element", () => {
    function WithInitialFocus() {
      const ref = useRef<HTMLInputElement>(null);
      return (
        <Dialog open onClose={() => undefined} title="Rename" initialFocusRef={ref}>
          <input data-testid="named" ref={ref} />
        </Dialog>
      );
    }
    render(<WithInitialFocus />);
    expect(document.activeElement).toBe(screen.getByTestId("named"));
  });

  it("returns focus to the trigger when it closes", () => {
    render(<ControlledDialog initialOpen={false} />);
    const opener = screen.getByTestId("opener");
    opener.focus();

    fireEvent.click(opener);
    expect(document.activeElement).not.toBe(opener);

    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(document.activeElement).toBe(opener);
  });

  it("wraps Tab from the last focusable element back to the first", () => {
    render(<ControlledDialog />);
    const dialog = screen.getByRole("dialog");
    const confirm = screen.getByTestId("confirm");
    const close = screen.getByLabelText("Close");

    confirm.focus();
    fireEvent.keyDown(dialog, { key: "Tab" });
    expect(document.activeElement).toBe(close);

    fireEvent.keyDown(dialog, { key: "Tab", shiftKey: true });
    expect(document.activeElement).toBe(confirm);
  });

  it("closes on a press outside the surface, and not on one inside it", () => {
    render(<ControlledDialog />);

    fireEvent.pointerDown(screen.getByTestId("field"));
    expect(screen.queryByRole("dialog")).not.toBeNull();

    fireEvent.pointerDown(document.querySelector(".yl-modal__scrim")!);
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("respects dismissOnEscape and dismissOnOutsideClick when they are off", () => {
    render(
      <Dialog
        open
        onClose={() => {
          throw new Error("should not be called");
        }}
        title="Sticky"
        dismissOnEscape={false}
        dismissOnOutsideClick={false}
      >
        <span>body</span>
      </Dialog>,
    );

    fireEvent.keyDown(document, { key: "Escape" });
    fireEvent.pointerDown(document.querySelector(".yl-modal__scrim")!);
    expect(screen.queryByRole("dialog")).not.toBeNull();
  });

  it("locks page scrolling while open and hands it back afterwards", () => {
    const { rerender } = render(
      <Dialog open onClose={() => undefined} title="Locked">
        <span>body</span>
      </Dialog>,
    );
    expect(document.body.style.overflow).toBe("hidden");

    rerender(
      <Dialog open={false} onClose={() => undefined} title="Locked">
        <span>body</span>
      </Dialog>,
    );
    expect(document.body.style.overflow).toBe("");
  });

  it("keeps the lock across nested overlays and releases it exactly once", () => {
    // Reference counting, checked over the whole sequence. Asserting only that the page is still
    // locked after the inner one closes proves nothing: without a count, the inner layer captures
    // the already-locked value as what to restore, so that step looks correct either way. What
    // breaks is the *last* release — the outer layer's restore was overwritten by the inner
    // layer's, so closing everything restores "hidden" and the page never scrolls again.
    function TwoLayers({ outer, inner }: { outer: boolean; inner: boolean }) {
      return (
        <>
          <Dialog open={outer} onClose={() => undefined} title="Outer">
            <span>outer</span>
          </Dialog>
          <Dialog open={inner} onClose={() => undefined} title="Inner">
            <span>inner</span>
          </Dialog>
        </>
      );
    }

    const { rerender } = render(<TwoLayers outer inner />);
    expect(document.body.style.overflow).toBe("hidden");

    rerender(<TwoLayers outer inner={false} />);
    expect(document.body.style.overflow).toBe("hidden");

    rerender(<TwoLayers outer={false} inner={false} />);
    expect(document.body.style.overflow).toBe("");
  });

  it("gives Escape to the innermost layer only", () => {
    // The failure this prevents: one keystroke closing the menu the user aimed at *and* the
    // dialog behind it, because both were listening on the document.
    const closed: string[] = [];
    function Nested() {
      const [innerOpen, setInnerOpen] = useState(true);
      return (
        <>
          <Dialog open onClose={() => closed.push("outer")} title="Outer">
            <span>outer</span>
          </Dialog>
          <Dialog
            open={innerOpen}
            onClose={() => {
              closed.push("inner");
              setInnerOpen(false);
            }}
            title="Inner"
          >
            <span>inner</span>
          </Dialog>
        </>
      );
    }

    render(<Nested />);
    act(() => {
      fireEvent.keyDown(document, { key: "Escape" });
    });
    expect(closed).toEqual(["inner"]);

    // With the inner one gone, the next press reaches the outer one.
    fireEvent.keyDown(document, { key: "Escape" });
    expect(closed).toEqual(["inner", "outer"]);
  });

  it("keeps Tab on the surface when it holds nothing focusable", () => {
    // No close button and no interactive content: Tab has nowhere to go, and letting it through
    // would move focus to the page behind — out of a modal, which is the one thing a trap exists
    // to prevent.
    render(
      <Dialog open onClose={() => undefined} title="Read only" showCloseButton={false}>
        <span>nothing to focus</span>
      </Dialog>,
    );

    const dialog = screen.getByRole("dialog");
    expect(document.activeElement).toBe(dialog);

    fireEvent.keyDown(dialog, { key: "Tab" });
    expect(document.activeElement).toBe(dialog);
  });

  it("hides the close button when asked", () => {
    render(
      <Dialog open onClose={() => undefined} title="Bare" showCloseButton={false}>
        <button type="button">only child</button>
      </Dialog>,
    );
    expect(screen.queryByLabelText("Close")).toBeNull();
  });

  it("applies the size variant and the caller's className", () => {
    render(
      <Dialog open onClose={() => undefined} title="Wide" size="lg" className="mine">
        <span>body</span>
      </Dialog>,
    );
    const dialog = screen.getByRole("dialog");
    expect(dialog.className).toContain("yl-dialog--lg");
    expect(dialog.className).toContain("mine");
  });
});

describe("Drawer", () => {
  it("carries the side variant", () => {
    render(
      <Drawer open onClose={() => undefined} side="left" title="Filters">
        <span>body</span>
      </Drawer>,
    );
    expect(screen.getByRole("dialog").className).toContain("yl-drawer--left");
  });

  it("defaults to the right edge", () => {
    render(
      <Drawer open onClose={() => undefined} title="Filters">
        <span>body</span>
      </Drawer>,
    );
    expect(screen.getByRole("dialog").className).toContain("yl-drawer--right");
  });

  it("passes an explicit size through as a custom property", () => {
    render(
      <Drawer open onClose={() => undefined} title="Filters" size="30rem">
        <span>body</span>
      </Drawer>,
    );
    expect(screen.getByRole("dialog").style.getPropertyValue("--yl-drawer-size")).toBe("30rem");
  });

  it("traps and restores focus like a dialog, since it is one", () => {
    const trigger = document.createElement("button");
    document.body.appendChild(trigger);
    trigger.focus();

    const { rerender } = render(
      <Drawer open onClose={() => undefined} title="Filters">
        <input data-testid="filter" />
      </Drawer>,
    );
    expect(document.activeElement).toBe(screen.getByLabelText("Close"));

    rerender(
      <Drawer open={false} onClose={() => undefined} title="Filters">
        <input data-testid="filter" />
      </Drawer>,
    );
    expect(document.activeElement).toBe(trigger);
    trigger.remove();
  });
});
