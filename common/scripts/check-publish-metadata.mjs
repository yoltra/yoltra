#!/usr/bin/env node
// Pre-publish guard: every publishable package must carry a repository.url that
// matches the source repo, or npm Trusted Publishing (provenance) rejects it
// with E422 — after some packages have already gone live, leaving a partial
// release. Run this BEFORE `rush publish` so the failure surfaces pre-tag.
//
// Usage: node common/scripts/check-publish-metadata.mjs
// Exits non-zero and lists every offending package.

import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const EXPECTED = "https://github.com/yoltra/yoltra.git";

// rush.json is JSONC (comments + trailing commas). Strip both without touching
// string literals (so the https:// $schema URL survives), then JSON.parse.
function parseJsonc(text) {
  const noComments = text.replace(
    /("(?:\\.|[^"\\])*")|\/\/[^\n]*|\/\*[\s\S]*?\*\//g,
    (_m, str) => (str ? str : ""),
  );
  return JSON.parse(noComments.replace(/,(\s*[}\]])/g, "$1"));
}

const rush = parseJsonc(readFileSync(join(repoRoot, "rush.json"), "utf8"));
const problems = [];

for (const project of rush.projects) {
  const pkgPath = join(repoRoot, project.projectFolder, "package.json");
  if (!existsSync(pkgPath)) continue;
  const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));

  if (pkg.private) continue; // not published — skip
  if (project.shouldPublish === false) continue;

  const url =
    typeof pkg.repository === "string" ? pkg.repository : pkg.repository?.url;

  if (!url) {
    problems.push(`${pkg.name}: missing "repository.url" (needed for npm provenance)`);
  } else if (url !== EXPECTED) {
    problems.push(`${pkg.name}: repository.url is "${url}", expected "${EXPECTED}"`);
  }
}

if (problems.length) {
  console.error("✗ Pre-publish metadata check failed:\n");
  for (const p of problems) console.error(`  - ${p}`);
  console.error(
    `\nAdd to each package.json:\n` +
      `  "repository": { "type": "git", "url": "${EXPECTED}" }\n`,
  );
  process.exit(1);
}

console.log("✓ All publishable packages have a valid repository.url.");
