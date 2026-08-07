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
 */

const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const zlib = require("node:zlib");
const { build } = require("esbuild");

async function main() {
  const cwd = process.cwd();
  const manifest = JSON.parse(fs.readFileSync(path.join(cwd, "package.json"), "utf8"));
  const { parseBudgets, entrySource, evaluate, formatResults, toKb } = await import(
    "../src/size-budget.ts"
  );

  const budgets = parseBudgets(manifest);
  if (budgets.length === 0) return;

  const reportOnly = process.argv.includes("--report");
  const results = [];

  for (const budget of budgets) {
    const modulePath = path.resolve(cwd, budget.entry ?? manifest.module ?? manifest.main);
    if (!fs.existsSync(modulePath)) {
      throw new Error(`${manifest.name}: ${modulePath} does not exist — run a build first`);
    }

    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "yoltra-size-"));
    const entryFile = path.join(tmp, "entry.js");
    fs.writeFileSync(entryFile, entrySource(modulePath, budget.import));

    const bundled = await build({
      entryPoints: [entryFile],
      bundle: true,
      minify: true,
      format: "esm",
      platform: "neutral",
      write: false,
      external: [...(budget.external ?? [])],
      logLevel: "silent",
    });

    const bytes = zlib.gzipSync(Buffer.from(bundled.outputFiles[0].contents)).length;
    fs.rmSync(tmp, { recursive: true, force: true });
    results.push(evaluate(budget, bytes));
  }

  process.stdout.write(`${manifest.name}\n${formatResults(manifest.name, results)}\n`);

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
