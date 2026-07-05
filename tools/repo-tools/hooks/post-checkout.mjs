#!/usr/bin/env node
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const [, , oldSha, newSha] = process.argv;

// determine repo root
function findRepoRoot(start = process.cwd()) {
  let d = start;
  for (; ;) {
    if (fs.existsSync(path.join(d, "rush.json")) || fs.existsSync(path.join(d, ".git"))) return d;
    const up = path.dirname(d);
    if (up === d) return start;
    d = up;
  }
}

const REPO = findRepoRoot();

// if this is the fisrt checkout or detached state, bail quietly
if (!oldSha || !newSha) process.exit(0);

function changedBetween(a, b) {
  try {
    const out = execSync(`git diff --name-only ${a} ${b}`, { cwd: REPO, encoding: "utf8" });
    return out.split("\n").map(s => s.trim()).filter(Boolean);
  } catch {
    return [];
  }
}

const changed = changedBetween(oldSha, newSha);
const rushInfraTouched = changed.some(p =>
  p.startsWith("common/config/rush/") || p === "rush.json"
);

if (!rushInfraTouched) process.exit(0);

// if the lockfile (pnpm) changed, run a fresh install
const lockChanged = changed.some(p =>
  p === "common/config/rush/pnpm-lock.yaml" || p.endsWith("shrinkwrap.yaml") || p.endsWith("lock.yaml")
);

try {
  console.log(lockChanged
    ? "🔧 post-checkout: Lockfile changed → running `rush install`..."
    : "🔧 post-checkout: Rush config changed → running `rush install`...");
  execSync("rush install", { cwd: REPO, stdio: "inherit" });
} catch (e) {
  console.error("❌ post-checkout: rush install failed.\n");
  process.exit(1);
}
