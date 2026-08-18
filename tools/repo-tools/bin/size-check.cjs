#!/usr/bin/env node
/**
 * Checks a package's bundle-size budgets, declared under `sizeLimit` in its package.json.
 *
 * Run per package by `rush size`. Measures the module a consumer imports, bundled, minified
 * and gzipped — not the size of the file in `dist`, which is unminified and says nothing
 * about what anybody ships.
 *
 * `--report` prints the measurements and always exits 0, which is how the budgets were set
 * in the first place.
 *
 * Every entry is measured twice: once plainly, and once with `NODE_ENV` defined as
 * `"production"`. The budget is enforced against the first — gating on the smaller figure would
 * let dev-only code grow without ever tripping the ceiling — while the second is what a consumer
 * actually ships, and therefore what the README publishes. The two differ by about 9% in
 * `@yoltra/core`, which is how a published claim of 9.2 KB survived while consumers paid 8.5.
 *
 * `--write-readme` regenerates the table between the `<!-- size-table:start -->` markers in each
 * package's `README.md` and `README.es.md`; `--check-readme` verifies it instead and exits 1 on
 * drift, which is the guard the size budget alone could never provide.
 */

const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { pathToFileURL } = require("node:url");
const zlib = require("node:zlib");
const { build, transform } = require("esbuild");

/**
 * Import a TypeScript module from a plain Node script.
 *
 * Node cannot `import()` a `.ts` file before 22.6, and `rush size` runs on whatever the repo
 * supports (>=18.18) — CI pins 20. So the source is type-stripped with the esbuild this script
 * already depends on, then imported from a temp file. `size-budget.ts` imports nothing, so
 * stripping types is the whole job; keep it that way or this needs to bundle instead.
 */
async function importTs(tsPath) {
  const { code } = await transform(fs.readFileSync(tsPath, "utf8"), {
    loader: "ts",
    format: "esm",
  });

  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "yoltra-ts-"));
  const file = path.join(dir, `${path.basename(tsPath, ".ts")}.mjs`);
  fs.writeFileSync(file, code);
  try {
    return await import(pathToFileURL(file).href);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

async function main() {
  const cwd = process.cwd();
  const manifest = JSON.parse(fs.readFileSync(path.join(cwd, "package.json"), "utf8"));
  const {
    parseBudgets,
    entrySource,
    evaluate,
    formatResults,
    formatMarkdownTable,
    replaceMarkedBlock,
    startMarker,
    endMarker,
    EN_LABELS,
    ES_LABELS,
  } = await importTs(path.join(__dirname, "../src/size-budget.ts"));

  const budgets = parseBudgets(manifest);
  if (budgets.length === 0) return;

  const reportOnly = process.argv.includes("--report");
  const writeReadme = process.argv.includes("--write-readme");
  const checkReadme = process.argv.includes("--check-readme");
  const results = [];

  /** Bundles one entry and returns its gzipped size, optionally as a production build. */
  const measure = async (budget, modulePath, define) => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "yoltra-size-"));
    const entryFile = path.join(tmp, "entry.js");
    fs.writeFileSync(entryFile, entrySource(modulePath, budget.import));

    try {
      const bundled = await build({
        entryPoints: [entryFile],
        bundle: true,
        minify: true,
        format: "esm",
        platform: "neutral",
        write: false,
        external: [...(budget.external ?? [])],
        logLevel: "silent",
        define,
      });
      return zlib.gzipSync(Buffer.from(bundled.outputFiles[0].contents)).length;
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  };

  for (const budget of budgets) {
    const modulePath = path.resolve(cwd, budget.entry ?? manifest.module ?? manifest.main);
    if (!fs.existsSync(modulePath)) {
      throw new Error(`${manifest.name}: ${modulePath} does not exist — run a build first`);
    }

    const bytes = await measure(budget, modulePath, {});
    const prodBytes = await measure(budget, modulePath, {
      "process.env.NODE_ENV": '"production"',
    });
    results.push(evaluate(budget, bytes, prodBytes));
  }

  process.stdout.write(`${manifest.name}\n${formatResults(manifest.name, results)}\n`);

  if (writeReadme || checkReadme) {
    const MARKER = "size-table";
    // The Spanish README is not optional here. The English core README carried a per-import
    // table and the Spanish one carried none, so half the readership was told a headline figure
    // with nothing behind it. Generating both is what keeps that from recurring.
    const targets = [
      { file: "README.md", labels: EN_LABELS },
      { file: "README.es.md", labels: ES_LABELS },
    ];
    const drifted = [];

    for (const target of targets) {
      const file = path.join(cwd, target.file);
      if (!fs.existsSync(file)) continue;

      const source = fs.readFileSync(file, "utf8");
      // A package without the markers has not opted in to publishing a table. Skipping is
      // correct, but say so: a generator that runs, succeeds and touches nothing is
      // indistinguishable from one that is broken.
      if (!source.includes(startMarker(MARKER)) || !source.includes(endMarker(MARKER))) {
        process.stdout.write(`  -- ${target.file}: no ${MARKER} markers, skipped\n`);
        continue;
      }

      const updated = replaceMarkedBlock(source, MARKER, formatMarkdownTable(results, target.labels));
      if (updated === source) {
        process.stdout.write(`  ok  ${target.file}: size table current\n`);
        continue;
      }
      if (writeReadme) {
        fs.writeFileSync(file, updated);
        process.stdout.write(`  ->  ${target.file}: size table rewritten\n`);
      } else {
        drifted.push(target.file);
      }
    }

    if (drifted.length > 0) {
      // stderr, so Rush fails the operation rather than burying it in a successful log.
      process.stderr.write(
        `${manifest.name}: size table out of date in ${drifted.join(", ")} — ` +
          `run \`rushx size --write-readme\` and commit the result\n`,
      );
      process.exit(1);
    }
  }

  const over = results.filter((r) => !r.withinBudget);
  if (over.length > 0 && !reportOnly) {
    // stderr, so Rush fails the operation rather than burying it in a successful log.
    process.stderr.write(
      `${manifest.name}: ${over.length} budget(s) exceeded — ${over
        .map((r) => `${r.name} at ${r.actualKb} KB over ${r.limitKb} KB`)
        .join("; ")}\n`,
    );
    process.exit(1);
  }
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exit(1);
});
