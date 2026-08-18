import { describe, expect, it } from "vitest";

import {
  EN_LABELS,
  ES_LABELS,
  entrySource,
  evaluate,
  formatMarkdownTable,
  formatResults,
  parseBudgets,
  replaceMarkedBlock,
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

describe("the production measurement", () => {
  it("keeps the budget pinned to the development build", () => {
    // The larger figure is the gated one on purpose. If the ceiling tracked the production
    // build, dev-only code could grow without limit because it never reaches a user.
    const result = evaluate({ limitKb: 9 }, 9.5 * 1024, 8 * 1024);
    expect(result.withinBudget).toBe(false);
    expect(result.actualKb).toBe(9.5);
    expect(result.shippedKb).toBe(8);
  });

  it("falls back to one measurement when only one was taken", () => {
    const result = evaluate({ limitKb: 8 }, 4 * 1024);
    expect(result.shippedKb).toBe(result.actualKb);
  });

  it("reports both numbers, so neither can be quoted alone", () => {
    const text = formatResults("@yoltra/core", [
      evaluate({ name: "a", limitKb: 8 }, 4 * 1024, 3 * 1024),
    ]);
    expect(text).toContain("4.0 KB");
    expect(text).toContain("ships 3.0 KB");
  });
});

describe("the published table", () => {
  const results = [
    evaluate({ name: "createStore", import: "{ createStore }", limitKb: 14 }, 9.1 * 1024, 8.3 * 1024),
    evaluate({ name: "barrel", limitKb: 18 }, 12 * 1024, 11.2 * 1024),
  ];

  it("publishes what a consumer ships, not what the budget gates", () => {
    const table = formatMarkdownTable(results, EN_LABELS);
    expect(table).toContain("8.3 KB");
    expect(table).not.toContain("9.1 KB");
  });

  it("labels a row with the import expression, which is the same in every language", () => {
    expect(formatMarkdownTable(results, EN_LABELS)).toContain("`{ createStore }`");
    expect(formatMarkdownTable(results, ES_LABELS)).toContain("`{ createStore }`");
  });

  it("translates only the barrel row and the headings", () => {
    expect(formatMarkdownTable(results, EN_LABELS)).toContain("| everything |");
    expect(formatMarkdownTable(results, ES_LABELS)).toContain("| todo |");
    expect(formatMarkdownTable(results, ES_LABELS)).toContain("Tamaño");
  });

  it("keeps the budget column, which is what makes a row falsifiable", () => {
    expect(formatMarkdownTable(results, EN_LABELS)).toContain("| 14 KB |");
  });
});

describe("marker replacement", () => {
  const doc = "intro\n<!-- size-table:start -->\nstale\n<!-- size-table:end -->\noutro\n";

  it("replaces only what lies between the markers", () => {
    const out = replaceMarkedBlock(doc, "size-table", "fresh");
    expect(out).toContain("intro");
    expect(out).toContain("outro");
    expect(out).toContain("fresh");
    expect(out).not.toContain("stale");
  });

  it("is idempotent, so a check run and a write run agree", () => {
    const once = replaceMarkedBlock(doc, "size-table", "fresh");
    expect(replaceMarkedBlock(once, "size-table", "fresh")).toBe(once);
  });

  it("refuses a document with no markers rather than inventing a location", () => {
    // Appending would write the table into whatever file it was pointed at. Where a published
    // number appears is the author's decision.
    expect(() => replaceMarkedBlock("no markers here", "size-table", "x")).toThrow(/missing/);
  });

  it("refuses markers that are inverted", () => {
    const bad = "<!-- size-table:end -->\n<!-- size-table:start -->";
    expect(() => replaceMarkedBlock(bad, "size-table", "x")).toThrow(/before/);
  });
});
