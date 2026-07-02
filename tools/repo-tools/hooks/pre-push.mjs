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

function safe(cmd) {
  try { return execSync(cmd, { cwd: REPO, encoding: "utf8" }).trim(); } catch { return ""; }
}
function changedSince(base) {
  const out = safe(`git diff --name-only ${base}...HEAD`);
  return out.split("\n").map(s => s.trim()).filter(Boolean);
}
function findProjectRoot(file) {
  let d = path.dirname(path.join(REPO, file));
  for (; ;) {
    if (fs.existsSync(path.join(d, "rush-project.json"))) return d;
    if (fs.existsSync(path.join(d, "package.json")) && fs.existsSync(path.join(d, "src"))) return d;
    const up = path.dirname(d);
    if (up === d || up.length < REPO.length) return null;
    d = up;
  }
}
function projectName(dir) {
  try {
    const pkg = JSON.parse(fs.readFileSync(path.join(dir, "package.json"), "utf8"));
    return pkg.name || null;
  } catch { return null; }
}

const branch = safe("git rev-parse --abbrev-ref HEAD") || "HEAD";
const upstream = safe(`git rev-parse --abbrev-ref ${branch}@{upstream}`); // e.g., origin/main
const base = upstream ? safe(`git merge-base ${upstream} HEAD`) : safe("git merge-base origin/main HEAD") || "HEAD~1";

const changedFiles = changedSince(base);
const pkgRoots = new Set(
  changedFiles
    .map(findProjectRoot)
    .filter(Boolean)
);

// 1) Changesets gate (require a changeset if packages changed)
if (pkgRoots.size > 0) {
  console.log("🔎 pre-push: checking for Changesets since base…");
  const cs = spawnSync("npx", ["changeset", "status", `--since=${base}`], { cwd: REPO, encoding: "utf8" });
  const out = (cs.stdout || "") + (cs.stderr || "");
  const hasChangeset = /(?<=Changesets: )\d+/.test(out) ? parseInt(out.match(/(?<=Changesets: )\d+/)[0], 10) > 0
    : !/No unreleased changesets found|No changesets present/i.test(out) ? true : false;
  if (!hasChangeset) {
    console.error(
      "\n❌ pre-push: package changes detected but no Changeset found.\n" +
      "Run: npx changeset (select affected packages, choose bump, write summary), commit, then push.\n"
    );
    process.exit(1);
  }
}

// affected build + test (use Rush -t to include deps)
const projects = Array.from(pkgRoots)
  .map(projectName)
  .filter(Boolean);

if (projects.length) {
  const toArgs = projects.flatMap(p => ["-t", p]);

  console.log(`🏗️  pre-push: rush build ${toArgs.join(" ")}\n`);
  const b = spawnSync("rush", ["build", ...toArgs], { cwd: REPO, stdio: "inherit" });
  if (b.status !== 0) process.exit(b.status ?? 1);

  console.log(`🧪 pre-push: rush test ${toArgs.join(" ")}\n`);
  const t = spawnSync("rush", ["test", ...toArgs], { cwd: REPO, stdio: "inherit" });
  if (t.status !== 0) process.exit(t.status ?? 1);
} else {
  console.log("ℹ️ pre-push: no affected projects (skipping build/test).");
}

process.exit(0);
