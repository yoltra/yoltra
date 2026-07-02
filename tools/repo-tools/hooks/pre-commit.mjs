#!/usr/bin/env node
import { execSync, spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

function repoRoot(start = process.cwd()) {
  let d = start;
  for (; ;) {
    if (fs.existsSync(path.join(d, "rush.json")) || fs.existsSync(path.join(d, ".git"))) return d;
    const up = path.dirname(d);
    if (up === d) return start;
    d = up;
  }
}

const REPO = repoRoot();

function stagedFiles() {
  const out = execSync("git diff --cached --name-only --diff-filter=ACMR", { cwd: REPO, encoding: "utf8" });
  return out.split("\n").map(s => s.trim()).filter(Boolean);
}

const IGNORED_DIR_RE = /(^|\/)(dist|build|coverage|node_modules|\.turbo|\.next|out|\.cache)\//;
const SRC_EXT_RE = /\.(ts|tsx|js|jsx|mjs|cjs)$/i;

const files = stagedFiles();

// block generated artifacts accidentally staged
const generated = files.filter(f => IGNORED_DIR_RE.test(f));
if (generated.length) {
  console.error(
    "\n❌ pre-commit: Generated files detected in the index:\n" +
    generated.map(f => `  - ${f}`).join("\n") +
    "\nFix: unstage them and commit only sources. If these must be committed, adjust ignores consciously.\n"
  );

  process.exit(1);
}

// lint only staged source files
const lintTargets = files.filter(f => SRC_EXT_RE.test(f) && fs.existsSync(path.join(REPO, f)));
if (lintTargets.length) {
  console.log("🧹 pre-commit: ESLint on staged files…");
  const r = spawnSync(
    process.execPath,
    [path.join("tools", "repo-tools", "bin", "repo-eslint.cjs"), "--max-warnings", "0", ...lintTargets],
    { cwd: REPO, stdio: "inherit" }
  );
  if (r.status !== 0) process.exit(r.status ?? 1);
} else {
  console.log("🧹 pre-commit: no staged source files to lint.");
}

process.exit(0);
