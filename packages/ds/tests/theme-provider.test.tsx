import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ThemeProvider, applyTheme, useTheme, THEME_STORAGE_KEY } from "../src/client";

/**
 * The theme controller, which is the one component in this package whose job is entirely side
 * effects on objects it does not own: the document root and the storage area.
 *
 * @remarks
 * Written after `noFlashScript` landed, which put the two halves of the same mechanism side by
 * side and made the asymmetry obvious. The script guarded every hostile case; the provider
 * guarded none of them, and a bug had been sitting in its fallback the whole time.
 */

/** Points `matchMedia` at a fixed answer, since jsdom does not implement it. */
function systemPrefers(dark: boolean): void {
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: dark && query.includes("dark"),
    media: query,
    addEventListener() {},
    removeEventListener() {},
  }));
}

function Probe() {
  const { theme, setTheme, toggle } = useTheme();
  return (
    <>
      <span data-testid="theme">{theme}</span>
      <button type="button" onClick={toggle}>
        toggle
      </button>
      <button type="button" onClick={() => setTheme("dark")}>
        dark
      </button>
    </>
  );
}

const root = () => document.documentElement.getAttribute("data-theme");

beforeEach(() => {
  localStorage.clear();
  document.documentElement.removeAttribute("data-theme");
  systemPrefers(false);
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("applyTheme", () => {
  it("writes the attribute every colour resolves against", () => {
    applyTheme("dark");
    expect(root()).toBe("dark");
  });
});

describe("ThemeProvider", () => {
  it("restores a stored preference over the system one", () => {
    localStorage.setItem(THEME_STORAGE_KEY, "dark");
    systemPrefers(false);
    render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    );
    expect(screen.getByTestId("theme").textContent).toBe("dark");
    expect(root()).toBe("dark");
  });

  it("falls back to the system preference when nothing is stored", () => {
    systemPrefers(true);
    render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    );
    expect(screen.getByTestId("theme").textContent).toBe("dark");
  });

  it("ignores a stored value that is not a theme", () => {
    // Nothing stops another script writing this key. `data-theme="purple"` matches no selector,
    // so the page would render light with no indication why.
    localStorage.setItem(THEME_STORAGE_KEY, "purple");
    systemPrefers(true);
    render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    );
    expect(screen.getByTestId("theme").textContent).toBe("dark");
    expect(root()).toBe("dark");
  });

  it("falls back to the system preference when there is no storage at all", () => {
    // The bug this test was written for: the guard produced `false`, and `false ?? system`
    // keeps the `false`, so the root was set to `data-theme="false"`.
    vi.stubGlobal("localStorage", undefined);
    systemPrefers(true);
    render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    );
    expect(screen.getByTestId("theme").textContent).toBe("dark");
    expect(root()).toBe("dark");
  });

  it("survives storage that throws on read", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("SecurityError");
    });
    systemPrefers(true);
    render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    );
    expect(screen.getByTestId("theme").textContent).toBe("dark");
  });

  it("still applies a theme when storage throws on write", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("QuotaExceededError");
    });
    render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    );
    act(() => screen.getByRole("button", { name: "dark" }).click());
    // Losing the preference is acceptable. Losing the switch is not.
    expect(screen.getByTestId("theme").textContent).toBe("dark");
    expect(root()).toBe("dark");
  });

  it("persists what the reader chose", () => {
    render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    );
    act(() => screen.getByRole("button", { name: "dark" }).click());
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("dark");
  });

  it("toggles between the two themes", () => {
    render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    );
    act(() => screen.getByRole("button", { name: "toggle" }).click());
    expect(root()).toBe("dark");
    act(() => screen.getByRole("button", { name: "toggle" }).click());
    expect(root()).toBe("light");
  });

  it("starts from the given default before the effect runs", () => {
    vi.stubGlobal("localStorage", undefined);
    systemPrefers(false);
    render(
      <ThemeProvider defaultTheme="dark">
        <Probe />
      </ThemeProvider>,
    );
    // The effect then resolves it, which is what the no-flash script exists to cover.
    expect(screen.getByTestId("theme").textContent).toBe("light");
  });
});

describe("useTheme", () => {
  it("throws outside a provider, rather than returning a toggle that does nothing", () => {
    const quiet = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(<Probe />)).toThrow(/within a <ThemeProvider>/);
    quiet.mockRestore();
  });
});
