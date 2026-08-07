import { describe, expect, it } from "vitest";

import {
  entrySource,
  evaluate,
  formatResults,
  parseBudgets,
  toKb,
} from "../src/size-budget";

describe("budget parsing", () => {
  it("reads declared budgets", () => {
    expect(parseBudgets({ sizeLimit: [{ limitKb: 8 }] })).toHaveLength(1);
  });

  it("treats an absent field as no budgets, not as an error", () => {
    expect(parseBudgets({})).toEqual([]);
  });

  it("refuses a budget with no usable ceiling", () => {
    for (const bad of [{}, { limitKb: 0 }, { limitKb: -1 }, { limitKb: "8" }]) {
      expect(() => parseBudgets({ sizeLimit: [bad] })).toThrow(/positive number/);
    }
  });

  it("refuses a field that is not a list", () => {
    expect(() => parseBudgets({ sizeLimit: { limitKb: 8 } })).toThrow(/must be an array/);
  });
});

describe("the synthetic entry", () => {
  it("references what it imports, so nothing shakes it away", () => {
    // Without the reference the bundler removes the import and every package measures as
    // empty — a budget that can never fail.
    const source = entrySource("/pkg/dist/index.mjs", "{ createStore }");
    expect(source).toContain('import { createStore } from "/pkg/dist/index.mjs"');
    expect(source).toContain("console.log(createStore)");
  });

  it("measures the whole barrel when no import is named", () => {
    const source = entrySource("/pkg/dist/index.mjs");
    expect(source).toContain("import * as all from");
    expect(source).toContain("console.log(all)");
  });
});

describe("evaluation", () => {
  it("passes at exactly the limit", () => {
    expect(evaluate({ limitKb: 8 }, 8 * 1024).withinBudget).toBe(true);
  });

  it("fails just over, and says by how much", () => {
    const result = evaluate({ limitKb: 8 }, 8.2 * 1024);
    expect(result.withinBudget).toBe(false);
    expect(result.headroomKb).toBeLessThan(0);
  });

  it("names an entry by its import when it has no name", () => {
    expect(evaluate({ limitKb: 8, import: "{ createStore }" }, 100).name).toBe("{ createStore }");
    expect(evaluate({ limitKb: 8 }, 100).name).toBe("barrel");
  });

  it("rounds to a tenth of a kilobyte, so comparisons are exact", () => {
    expect(toKb(1024)).toBe(1);
    expect(toKb(1536)).toBe(1.5);
  });
});

describe("output", () => {
  it("marks the entries that are over", () => {
    const text = formatResults("@yoltra/core", [
      evaluate({ name: "a", limitKb: 8 }, 4 * 1024),
      evaluate({ name: "b", limitKb: 1 }, 4 * 1024),
    ]);
    expect(text).toContain("ok   a");
    expect(text).toContain("OVER b");
    expect(text).toContain("3.0 KB over");
  });
});
