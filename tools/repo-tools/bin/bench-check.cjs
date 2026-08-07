#!/usr/bin/env node
/**
 * Compares a benchmark run with the committed baseline, or records a new one.
 *
 * Usage, from a package with benchmarks:
 *   node ../../tools/repo-tools/bin/bench-check.cjs            compare
 *   node ../../tools/repo-tools/bin/bench-check.cjs --record   overwrite the baseline
 *
 * Always exits 0. These are for reading, not for gating: the variance on a shared runner is
 * not yet known, and a benchmark gate that fails intermittently is one people learn to
 * ignore. Recording a baseline is deliberate and manual, so a regression cannot be
 * normalised away by a routine re-run.
 */

const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

async function main() {
  const cwd = process.cwd();
  const baselinePath = path.join(cwd, "benchmarks", "baseline.json");
  const out = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "yoltra-bench-")), "bench.json");

  execFileSync("npx", ["vitest", "bench", "--run", `--outputJson=${out}`], {
    cwd,
    stdio: ["ignore", "ignore", "inherit"],
  });

  const { readSamples, toBaseline, compareWithBaseline, formatComparisons } = await import(
    "../src/bench-baseline.ts"
  );
  const samples = readSamples(JSON.parse(fs.readFileSync(out, "utf8")));

  if (process.argv.includes("--record")) {
    const stamp = new Date().toISOString();
    fs.writeFileSync(baselinePath, `${JSON.stringify(toBaseline(samples, stamp), null, 2)}\n`);
    process.stdout.write(`recorded ${samples.length} benchmarks to ${path.relative(cwd, baselinePath)}\n`);
    return;
  }

  if (!fs.existsSync(baselinePath)) {
    process.stdout.write("no baseline recorded yet; run with --record\n");
    return;
  }

  const baseline = JSON.parse(fs.readFileSync(baselinePath, "utf8"));
  process.stdout.write(`${formatComparisons(compareWithBaseline(samples, baseline))}\n`);
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exit(1);
});
