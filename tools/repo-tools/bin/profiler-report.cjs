#!/usr/bin/env node
/**
 * Regenerates the profiler summary from the committed React Profiler exports.
 *
 * Usage:  node tools/repo-tools/bin/profiler-report.cjs [--write]
 *
 * Requires Node >= 22.6, because it imports the TypeScript parser directly rather than
 * keeping a second copy of the arithmetic in JavaScript. Only a human regenerating the
 * figures runs this; the check that guards them runs under vitest and needs no such floor.
 *
 * Prints the markdown table the comparison document publishes. With `--write` it also
 * refreshes `profiler-summary.json` beside the document, which is what the example's page
 * reads so the figures on it come from the captures rather than from a typist.
 */

const fs = require("node:fs");
const path = require("node:path");

const REPO = path.resolve(__dirname, "..", "..", "..");
const EXAMPLE = path.join(REPO, "examples", "v0", "yoltra-in-react");
const PROFILER = path.join(EXAMPLE, "public", "assets", "profiler");

/** Frames 08-19 are the toggle commits; the first seven are startup and are near-identical. */
const WINDOW = { fromFrame: 8, toFrame: 19 };

function findCapture(kind) {
  const dir = path.join(PROFILER, kind);
  const file = fs.readdirSync(dir).find((f) => f.startsWith("profiling-data.") && f.endsWith(".json"));
  if (file === undefined) throw new Error(`no profiling export in ${dir}`);
  return path.join(dir, file);
}

async function main() {
  // The parser is TypeScript, so this reaches for the compiled-on-the-fly copy vitest uses.
  // Kept as a dynamic import so the CLI stays a plain script with no build step of its own.
  const { compare, renderTable, round } = await import("../src/profiler-report.ts");

  const yoltraPath = findCapture("yoltra");
  const rtkPath = findCapture("rtk");
  const report = compare(
    JSON.parse(fs.readFileSync(yoltraPath, "utf8")),
    JSON.parse(fs.readFileSync(rtkPath, "utf8")),
    WINDOW,
  );

  process.stdout.write(`${renderTable(report)}\n`);

  if (process.argv.includes("--write")) {
    const summary = {
      generatedFrom: {
        yoltra: path.relative(REPO, yoltraPath),
        rtk: path.relative(REPO, rtkPath),
      },
      window: WINDOW,
      session: {
        commits: report.yoltra.commits,
        yoltraMs: round(report.yoltra.totalMs, 1),
        rtkMs: round(report.rtk.totalMs, 1),
      },
      toggleCommits: {
        commits: report.window.yoltra.commits,
        yoltraMs: round(report.window.yoltra.totalMs, 1),
        rtkMs: round(report.window.rtk.totalMs, 1),
        yoltraMeanMs: round(report.window.yoltra.meanMs, 2),
        rtkMeanMs: round(report.window.rtk.meanMs, 2),
        yoltraFibers: report.window.yoltra.fibers,
        rtkFibers: report.window.rtk.fibers,
      },
    };
    const out = path.join(EXAMPLE, "profiler-summary.json");
    fs.writeFileSync(out, `${JSON.stringify(summary, null, 2)}\n`);
    process.stdout.write(`\nwrote ${path.relative(REPO, out)}\n`);
  }
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exit(1);
});
