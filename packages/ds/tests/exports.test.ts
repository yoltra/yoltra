import { describe, expect, it } from "vitest";

import * as main from "../src/index";
import * as client from "../src/client";

/**
 * What the package actually exports.
 *
 * @remarks
 * This exists because five working hooks shipped inside the bundle for four releases and were
 * exported by neither entry point, so nothing could reach them and nothing failed. A missing export
 * is invisible to every other kind of test: the code compiles, the tests pass, and the feature does
 * not exist as far as a consumer is concerned.
 */

describe("the overlay behaviours are reachable", () => {
  it("exports the five hooks that were unreachable", () => {
    for (const name of ["useFocusTrap", "useDismiss", "useReturnFocus", "useScrollLock", "focusableWithin"]) {
      expect(typeof (client as Record<string, unknown>)[name], name).toBe("function");
    }
  });

  it("keeps them off the server-safe entry, where their effects could not run", () => {
    for (const name of ["useFocusTrap", "useDismiss", "useScrollLock"]) {
      expect(name in main, name).toBe(false);
    }
  });
});

describe("the components added for consumers who had built their own", () => {
  it("exports Label, so nobody has to know the class name", () => {
    expect(typeof main.Label).toBe("function");
  });

  it("exports TableScroll", () => {
    expect(typeof main.TableScroll).toBe("function");
  });
});

describe("the split between the two entry points", () => {
  it("keeps every interactive surface on the client entry", () => {
    for (const name of ["Dialog", "Drawer", "Popover", "Menu", "ContextMenu", "Tooltip", "Tabs", "CodeBlock", "ThemeProvider"]) {
      expect(name in client, name).toBe(true);
      expect(name in main, name).toBe(false);
    }
  });

  it("keeps the tokens on the server-safe entry, where a server render needs them", () => {
    for (const name of ["foundationTokens", "lightTheme", "darkTheme", "themes", "themeCss"]) {
      expect(name in main, name).toBe(true);
    }
  });

  it("does not export the palette binding, which is internal", () => {
    // Reachable as `foundationTokens.palette`. A second public name for one object would be
    // surface with no purpose, and it exists as a binding only so the themes can be tree-shaken.
    expect("palette" in main).toBe(false);
  });
});
