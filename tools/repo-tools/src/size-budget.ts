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
  /**
   * The measurement the budget is enforced against, bundled without defining `NODE_ENV`.
   *
   * @remarks
   * This is the larger of the two numbers, because it retains every `process.env.NODE_ENV`
   * guard in the source. The budget stays pinned to it deliberately: gating on the smaller
   * production figure would let dev-only code grow without ever tripping the ceiling.
   */
  readonly actualKb: number;
  /**
   * What a consumer actually ships, bundled with `NODE_ENV` defined as `"production"`.
   *
   * @remarks
   * This is the honest number for a README, and it is the one the generated table publishes.
   * Every bundler a consumer is realistically using defines `NODE_ENV` in a production build,
   * so the dev figure overstates what anybody pays.
   */
  readonly shippedKb: number;
  /**
   * The import expression this entry measured, when it named one.
   *
   * @remarks
   * Kept separate from {@link BudgetResult.name}, which is a human label for terminal output.
   * A published table wants the expression, because it is code the reader can paste.
   */
  readonly importExpr?: string;
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

/**
 * Compares a measurement against its budget.
 *
 * @param prodBytes - The same module bundled with `NODE_ENV` defined as `"production"`.
 * Defaults to `bytes`, so a caller that measures only once still gets a coherent result.
 */
export function evaluate(entry: BudgetEntry, bytes: number, prodBytes: number = bytes): BudgetResult {
  const actualKb = toKb(bytes);
  return {
    name: entry.name ?? entry.import ?? "barrel",
    limitKb: entry.limitKb,
    actualKb,
    shippedKb: toKb(prodBytes),
    importExpr: entry.import,
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
      // Both numbers, always. Printing only the gated one is how the README came to claim a
      // figure nobody could reproduce: the measurement the budget uses and the measurement a
      // consumer experiences are different, and hiding either invites the other to be quoted.
      const shipped = `ships ${r.shippedKb.toFixed(1)} KB`;
      return `  ${mark} ${r.name.padEnd(22)} ${r.actualKb.toFixed(1).padStart(6)} KB / ${String(r.limitKb).padStart(5)} KB  (${headroom}, ${shipped})`;
    })
    .join("\n")
    .concat(results.length > 0 ? "" : `  ${pkg}: no budgets declared`);
}

/** Column headings and the barrel row's label, so the table can be emitted in either language. */
export interface TableLabels {
  readonly importCol: string;
  readonly sizeCol: string;
  readonly budgetCol: string;
  /** What to call the row that imports the whole barrel. */
  readonly everything: string;
}

/** English column headings. */
export const EN_LABELS: TableLabels = {
  importCol: "Import",
  sizeCol: "Size",
  budgetCol: "Budget",
  everything: "everything",
};

/** Spanish column headings. */
export const ES_LABELS: TableLabels = {
  importCol: "Import",
  sizeCol: "Tamaño",
  budgetCol: "Presupuesto",
  everything: "todo",
};

/**
 * Renders the published size table.
 *
 * @remarks
 * Publishes {@link BudgetResult.shippedKb}, not the gated figure — the table answers "what does
 * this cost me?", and the answer a consumer lives with is the production one. The budget column
 * is what makes each row falsifiable: without it the number is a claim, with it the number is a
 * claim plus the ceiling that would have caught it moving.
 *
 * Row labels are the import expression itself, which is code and therefore the same in every
 * language; only the barrel row needs translating.
 */
export function formatMarkdownTable(
  results: readonly BudgetResult[],
  labels: TableLabels,
): string {
  const rows = results.map((r) => {
    // Prefer the import expression: it is the line a reader would actually write, and it is
    // identical in every language. An entry that names no import is measuring the whole
    // barrel, which is the one row that needs a translated word.
    const label = r.importExpr ? `\`${r.importExpr}\`` : labels.everything;
    return `| ${label} | ${r.shippedKb.toFixed(1)} KB | ${r.limitKb} KB |`;
  });
  return [
    `| ${labels.importCol} | ${labels.sizeCol} | ${labels.budgetCol} |`,
    "| --- | --- | --- |",
    ...rows,
  ].join("\n");
}

/** Opening marker for a generated block. */
export function startMarker(marker: string): string {
  return `<!-- ${marker}:start -->`;
}

/** Closing marker for a generated block. */
export function endMarker(marker: string): string {
  return `<!-- ${marker}:end -->`;
}

/**
 * Replaces the text between `<!-- marker:start -->` and `<!-- marker:end -->`.
 *
 * @remarks
 * Throws rather than appending when the markers are missing. A generator that silently creates
 * its own block writes the table into whatever file it was pointed at, including the wrong one;
 * requiring the author to place the markers keeps the decision about *where* a number appears in
 * the document, where it belongs.
 */
export function replaceMarkedBlock(source: string, marker: string, block: string): string {
  const open = startMarker(marker);
  const close = endMarker(marker);
  const from = source.indexOf(open);
  const to = source.indexOf(close);

  if (from === -1 || to === -1) {
    throw new Error(`missing ${from === -1 ? open : close} marker`);
  }
  if (to < from) {
    throw new Error(`${close} appears before ${open}`);
  }

  return `${source.slice(0, from + open.length)}\n${block}\n${source.slice(to)}`;
}
