import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useState } from "react";

import { AuthCard, Chip, ProgressBar, Stat, StatGrid, noFlashScript, THEME_STORAGE_KEY } from "../src/index";
import { useControllableState } from "../src/client";

/**
 * The components added in 0.4.0, each because a consuming project had already built it.
 *
 * @remarks
 * Weighted towards the contracts that are easy to get wrong rather than towards markup, which the
 * DOM snapshots already record.
 */

afterEach(cleanup);

describe("Stat", () => {
  it("reads label before value, so the number has a subject", () => {
    render(<Stat label="Open downloads" value={12} />);
    expect(screen.getByText("Open downloads").compareDocumentPosition(screen.getByText("12")))
      .toBe(Node.DOCUMENT_POSITION_FOLLOWING);
  });

  it("renders a real zero rather than treating it as absent", () => {
    render(<Stat label="Failed" value={0} />);
    // `0` is falsy, so a component written with `value && ...` would render nothing here and tell
    // the reader the figure is unavailable when it is simply none.
    expect(screen.getByText("0")).toBeDefined();
  });

  it("omits the hint entirely when there is none", () => {
    const { container } = render(<Stat label="Uptime" value="99%" />);
    expect(container.querySelector(".yl-stat__hint")).toBeNull();
  });

  it("renders a hint when given one", () => {
    render(<Stat label="Disk" value="4.2 GB" hint="of 20 GB" />);
    expect(screen.getByText("of 20 GB")).toBeDefined();
  });

  it("groups into a grid", () => {
    const { container } = render(
      <StatGrid>
        <Stat label="a" value={1} />
        <Stat label="b" value={2} />
      </StatGrid>,
    );
    expect(container.querySelectorAll(".yl-stat-grid .yl-stat")).toHaveLength(2);
  });
});

describe("Chip", () => {
  it("is not interactive, because a removable chip is a button", () => {
    render(<Chip>gguf</Chip>);
    expect(screen.queryByRole("button")).toBeNull();
    expect(screen.getByText("gguf").tagName).toBe("SPAN");
  });
});

describe("ProgressBar", () => {
  it("reports its position to assistive technology", () => {
    render(<ProgressBar label="Downloading" value={3} max={12} />);
    const bar = screen.getByRole("progressbar", { name: "Downloading" });
    expect(bar.getAttribute("aria-valuenow")).toBe("3");
    expect(bar.getAttribute("aria-valuemin")).toBe("0");
    expect(bar.getAttribute("aria-valuemax")).toBe("12");
  });

  it("prefers a human reading of the value when given one", () => {
    render(<ProgressBar label="Downloading" value={3} max={12} valueText="3 of 12 files" />);
    expect(screen.getByRole("progressbar").getAttribute("aria-valuetext")).toBe("3 of 12 files");
  });

  it("clamps a value past the end rather than overflowing", () => {
    // Production data arrives long after the component was reviewed.
    render(<ProgressBar label="Downloading" value={99} max={10} />);
    const bar = screen.getByRole("progressbar");
    expect(bar.getAttribute("aria-valuenow")).toBe("10");
    expect(bar.style.getPropertyValue("--progress-fraction")).toBe("1");
  });

  it("clamps a negative value to the start", () => {
    render(<ProgressBar label="Downloading" value={-5} />);
    expect(screen.getByRole("progressbar").getAttribute("aria-valuenow")).toBe("0");
  });

  it("survives a max of zero rather than dividing by it", () => {
    render(<ProgressBar label="Downloading" value={1} max={0} />);
    const bar = screen.getByRole("progressbar");
    expect(bar.getAttribute("aria-valuemax")).toBe("100");
    expect(bar.style.getPropertyValue("--progress-fraction")).not.toContain("NaN");
  });
});

describe("AuthCard", () => {
  it("is the page's main landmark and heading by default", () => {
    render(<AuthCard title="Sign in">form</AuthCard>);
    expect(screen.getByRole("main")).toBeDefined();
    expect(screen.getByRole("heading", { level: 1, name: "Sign in" })).toBeDefined();
  });

  it("can stop being a landmark, for when it is not the whole page", () => {
    render(
      <AuthCard as="div" title="Sign in to continue">
        form
      </AuthCard>,
    );
    // Two `main` landmarks tell a screen reader nothing about which holds the content.
    expect(screen.queryByRole("main")).toBeNull();
    expect(screen.getByRole("heading", { level: 1 })).toBeDefined();
  });
});

describe("useControllableState", () => {
  function Probe({ value, onChange }: { value?: string; onChange?: (next: string) => void }) {
    const [current, set] = useControllableState({ value, defaultValue: "a", onChange });
    return (
      <button type="button" onClick={() => set("b")}>
        {current}
      </button>
    );
  }

  it("owns the value when the caller passes none", () => {
    render(<Probe />);
    act(() => screen.getByRole("button").click());
    expect(screen.getByRole("button").textContent).toBe("b");
  });

  it("does not move when the caller owns it and declines the change", () => {
    const onChange = vi.fn();
    render(<Probe value="a" onChange={onChange} />);
    act(() => screen.getByRole("button").click());
    // The controlled value wins on every render. Copying it into state once would let the component
    // move and snap back, which looks like a bug in the parent.
    expect(screen.getByRole("button").textContent).toBe("a");
    expect(onChange).toHaveBeenCalledWith("b");
  });

  it("moves when the caller owns it and accepts the change", () => {
    function Owner() {
      const [value, setValue] = useState("a");
      return <Probe value={value} onChange={setValue} />;
    }
    render(<Owner />);
    act(() => screen.getByRole("button").click());
    expect(screen.getByRole("button").textContent).toBe("b");
  });

  it("reports changes even when uncontrolled, so a caller can observe without owning", () => {
    const onChange = vi.fn();
    render(<Probe onChange={onChange} />);
    act(() => screen.getByRole("button").click());
    expect(onChange).toHaveBeenCalledWith("b");
    expect(screen.getByRole("button").textContent).toBe("b");
  });
});

describe("noFlashScript", () => {
  it("reads the same key the provider writes", () => {
    expect(noFlashScript()).toContain(JSON.stringify(THEME_STORAGE_KEY));
  });

  it("takes a key, for an application that uses its own", () => {
    expect(noFlashScript({ storageKey: "app.theme" })).toContain('"app.theme"');
  });

  it("sets the attribute the tokens resolve against", () => {
    expect(noFlashScript()).toContain('setAttribute("data-theme"');
  });

  it("falls back to the system preference", () => {
    expect(noFlashScript()).toContain("prefers-color-scheme: dark");
  });

  it("is wrapped in try, because reading storage throws when site data is blocked", () => {
    // A theme that fails to restore is a lost preference. An exception here is a blank page.
    expect(noFlashScript()).toContain("try{");
    expect(noFlashScript()).toContain("catch(e){}");
  });

  it("actually runs, and sets the attribute", () => {
    localStorage.setItem(THEME_STORAGE_KEY, "dark");
    try {
      // eslint-disable-next-line no-eval
      eval(noFlashScript());
      expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
    } finally {
      localStorage.removeItem(THEME_STORAGE_KEY);
      document.documentElement.removeAttribute("data-theme");
    }
  });
});
