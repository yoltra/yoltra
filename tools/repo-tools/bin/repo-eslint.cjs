#!/usr/bin/env node
const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");

// always use the real current working directory (package dir under rushx)
const runtimeCwd = process.cwd();

// find repo root (rush.json or .git)
function findRepoRoot(start) {
  let dir = start;
  for (; ;) {
    if (fs.existsSync(path.join(dir, "rush.json")) || fs.existsSync(path.join(dir, ".git"))) return dir;
    const up = path.dirname(dir);
    if (up === dir) return start;
    dir = up;
  }
}
const repoRoot = findRepoRoot(runtimeCwd);
const toolsRoot = path.join(repoRoot, "tools", "repo-tools");

// resolve ESLint strictly from repo-tools
const eslintPkgPath = require.resolve("eslint/package.json", { paths: [toolsRoot] });
const eslintCli = path.join(path.dirname(eslintPkgPath), "bin", "eslint.js");

// config in repo-tools (lives next to deps)
const configPath = path.join(toolsRoot, "eslint.config.mjs");
const cachePath = path.join(repoRoot, "common", "temp", ".eslintcache");

// if user provided no targets, default to "."
const userArgs = process.argv.slice(2);
const hasTarget = userArgs.some(a => !a.startsWith("-"));
const targets = hasTarget ? [] : ["."];
const baseArgs = ["-c", configPath, "--no-warn-ignored", "--cache", "--cache-location", cachePath];

const child = spawn(process.execPath, [eslintCli, ...baseArgs, ...userArgs, ...targets], {
  stdio: "inherit",
  cwd: runtimeCwd
});

child.on("exit", code => process.exit(code));
