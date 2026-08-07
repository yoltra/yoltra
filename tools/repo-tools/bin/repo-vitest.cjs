#!/usr/bin/env node
/**
 * Vitest wrapper that filters one known-benign stderr banner.
 *
 * Why this exists: Rush is configured with `allowWarningsInSuccessfulBuild: false`
 * for `test` (common/config/rush/command-line.json), so ANY bytes on stderr fail
 * the operation. Vitest 3.2.4 unconditionally warns
 *
 *   Testing types with tsc and vue-tsc is an experimental feature.
 *   Breaking changes might not follow SemVer, please pin Vitest's version when using it.
 *
 * whenever `typecheck.enabled` is true — there is no flag or env var to silence it
 * (vitest/dist/chunks/coverage.*.js, guarded only by `if (resolved.typecheck.enabled)`).
 * Vitest IS pinned to an exact version by common-versions.json, so the advice is
 * already followed and the banner is pure noise.
 *
 * Everything else on stderr is forwarded untouched, and the child's exit code is
 * propagated, so real failures still fail.
 *
 * Usage in a package.json script:
 *   "test": "node ../../tools/repo-tools/bin/repo-vitest.cjs --typecheck --coverage --watch=false"
 */
const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");

const runtimeCwd = process.cwd();

function findRepoRoot(start) {
  let dir = start;
  for (;;) {
    if (fs.existsSync(path.join(dir, "rush.json")) || fs.existsSync(path.join(dir, ".git"))) {
      return dir;
    }
    const up = path.dirname(dir);
    if (up === dir) return start;
    dir = up;
  }
}

const repoRoot = findRepoRoot(runtimeCwd);

// Resolve vitest from the package being tested, falling back to repo-tools.
const vitestPkgPath = require.resolve("vitest/package.json", {
  paths: [runtimeCwd, path.join(repoRoot, "tools", "repo-tools")],
});
const vitestCli = path.join(path.dirname(vitestPkgPath), "vitest.mjs");

/** Exact lines to drop. Anything not matched here is forwarded verbatim. */
const SUPPRESSED = [
  "Testing types with tsc and vue-tsc is an experimental feature.",
  "Breaking changes might not follow SemVer, please pin Vitest's version when using it.",
];

// Strip ANSI so colourised output still matches, then compare on trimmed content.
// eslint-disable-next-line no-control-regex
const ANSI = /\[[0-9;]*m/g;
const isSuppressed = (line) => {
  const clean = line.replace(ANSI, "").trim();
  return clean === "" || SUPPRESSED.includes(clean);
};

const child = spawn(process.execPath, [vitestCli, ...process.argv.slice(2)], {
  stdio: ["inherit", "inherit", "pipe"],
  cwd: runtimeCwd,
});

let pending = "";

function flush(chunk, final) {
  pending += chunk;
  const lines = pending.split("\n");
  pending = final ? "" : (lines.pop() ?? "");
  if (final && lines.length === 0) return;

  const kept = lines.filter((line) => !isSuppressed(line));
  if (kept.length > 0) process.stderr.write(kept.join("\n") + "\n");
}

child.stderr.setEncoding("utf8");
child.stderr.on("data", (chunk) => flush(chunk, false));
child.stderr.on("end", () => flush("", true));

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 1);
});
