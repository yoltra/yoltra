/**
 * Bundle-size budgets, measured the way a consumer would actually ship the code.
 *
 * @remarks
 * The core README has claimed "~8KB (minified + gzipped)" since before there was anything to
 * check it, and the built `dist` is not minified — reading its size gives 17.8 KB and tells
 * you nothing about what a consumer pays. What matters is the bundle after tree-shaking and
 * minification, which is what this measures.
 *
 * Uses esbuild rather than `size-limit` so the budget lives in one shared tool with one
 * dependency, instead of a devDependency and a config file in every published package.
 *
 * Pure functions only; `bin/size-check.cjs` owns the bundling and the file system.
 *
 * @module
 */

/** One thing to measure, declared under `sizeLimit` in a package's `package.json`. */
export interface BudgetEntry {
  /** Shown in output. Defaults to the import expression, or "barrel". */
  readonly name?: string;
  /** Module to measure. Defaults to the package's `module` field. */
  readonly entry?: string;
  /**
   * Named imports to pull, e.g. `"{ createStore }"`.
   *
   * @remarks
   * Omitting it measures the whole barrel. Naming an import measures what a consumer who uses
   * only that gets, which is the number a tree-shakeable package should be judged on and the
   * one the README claim is really about.
   */
  readonly import?: string;
  /** Ceiling in kilobytes, minified and gzipped. */
  readonly limitKb: number;
  /** Left out of the bundle — peer dependencies, which the consumer already has. */
  readonly external?: readonly string[];
}

/** What measuring one entry produced. */
export interface BudgetResult {
  readonly name: string;
  readonly limitKb: number;
  readonly actualKb: number;
  readonly withinBudget: boolean;
  /** Headroom in kilobytes; negative when over. */
  readonly headroomKb: number;
}

/** Kilobytes to one decimal, so a budget comparison is exact rather than close. */
export function toKb(bytes: number): number {
  return Math.round((bytes / 1024) * 10) / 10;
}

/** Reads and validates the `sizeLimit` field of a package manifest. */
export function parseBudgets(manifest: unknown): readonly BudgetEntry[] {
  const raw = (manifest as { sizeLimit?: unknown }).sizeLimit;
  if (raw === undefined) return [];
  if (!Array.isArray(raw)) throw new Error("sizeLimit must be an array");

  return raw.map((entry, index) => {
    const e = entry as BudgetEntry;
    if (typeof e.limitKb !== "number" || !Number.isFinite(e.limitKb) || e.limitKb <= 0) {
      throw new Error(`sizeLimit[${index}]: limitKb must be a positive number`);
    }
    return e;
  });
}

/** The synthetic module esbuild is pointed at. */
export function entrySource(modulePath: string, importExpression?: string): string {
  // The console reference is what stops a bundler concluding the import is unused and
  // shaking away the very thing being measured.
  if (importExpression === undefined) {
    return `import * as all from ${JSON.stringify(modulePath)};\nconsole.log(all);\n`;
  }
  return `import ${importExpression} from ${JSON.stringify(modulePath)};\nconsole.log(${
    importExpression.replace(/[{}]/g, "").trim()
  });\n`;
}

/** Compares a measurement against its budget. */
export function evaluate(entry: BudgetEntry, bytes: number): BudgetResult {
  const actualKb = toKb(bytes);
  return {
    name: entry.name ?? entry.import ?? "barrel",
    limitKb: entry.limitKb,
    actualKb,
    withinBudget: actualKb <= entry.limitKb,
    headroomKb: Math.round((entry.limitKb - actualKb) * 10) / 10,
  };
}

/** One line per entry, aligned, with the failing ones marked. */
export function formatResults(pkg: string, results: readonly BudgetResult[]): string {
  return results
    .map((r) => {
      const mark = r.withinBudget ? "ok  " : "OVER";
      const headroom = r.withinBudget
        ? `${r.headroomKb.toFixed(1)} KB spare`
        : `${Math.abs(r.headroomKb).toFixed(1)} KB over`;
      return `  ${mark} ${r.name.padEnd(22)} ${r.actualKb.toFixed(1).padStart(6)} KB / ${String(r.limitKb).padStart(5)} KB  (${headroom})`;
    })
    .join("\n")
    .concat(results.length > 0 ? "" : `  ${pkg}: no budgets declared`);
}
