#!/usr/bin/env node
/**
 * Verifies that the committed API reference matches the source it documents.
 *
 * TypeDoc output is committed to the repository, which gives it the authority of a reviewed file
 * and none of the guarantees of a build artefact. It drifted a whole minor release: `Rejected`,
 * `EmitResult`, `CascadeInfo`, `NotifiedPhase`, `ConnectOptions`, `CallHandle`, `isRejected` and
 * `onCascade` appeared in **no document at all**, while every symbol that predated them was
 * documented normally. Regenerating produced 52 changed files and 12 entirely new pages.
 *
 * Nothing caught it, because the only docs check in CI verified that every page carried the logo.
 * A page can carry a logo and describe a function that no longer exists.
 *
 * Usage — regenerate first, then check that nothing moved:
 *   rush docs && node check-docs-current.mjs
 *
 * **`git diff` is the wrong instrument here.** A release that adds public API adds *new* pages,
 * and those are untracked rather than modified — exactly the case that drifted. `git status`
 * sees both.
 */

import { execFileSync } from "node:child_process";

/**
 * Docs directories that are actually committed, derived from the index rather than a hard-coded
 * list, so a package that starts committing docs is covered without editing this file.
 *
 * @param lsFiles - output of `git ls-files`, one path per line.
 * @returns sorted, de-duplicated directory paths.
 */
export function committedDocsDirs(lsFiles) {
  const dirs = new Set();
  for (const line of lsFiles.split("\n")) {
    const match = /^((?:packages|devtools)\/[^/]+\/docs)\//.exec(line.trim());
    if (match) dirs.add(match[1]);
  }
  return [...dirs].sort();
}

/**
 * Parses `git status --porcelain` into human-readable findings.
 *
 * Porcelain v1 is `XY <path>`, where `??` is untracked — a page for a symbol that did not exist
 * when the reference was last generated, which is the drift that matters most.
 *
 * @returns one entry per changed path, most legible form first.
 */
export function staleDocs(porcelain) {
  const out = [];
  for (const raw of porcelain.split("\n")) {
    if (raw.trim() === "") continue;
    const code = raw.slice(0, 2).trim();
    const path = raw.slice(3).trim();
    const kind = code === "??" ? "missing from the committed reference" : "out of date";
    out.push(`${path} — ${kind}`);
  }
  return out;
}

/* c8 ignore start — CLI wiring */
const invokedDirectly =
  process.argv[1] !== undefined && import.meta.url.endsWith(process.argv[1].replace(/\\/g, "/"));

if (invokedDirectly) {
  const git = (...args) => execFileSync("git", args, { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });

  const dirs = committedDocsDirs(git("ls-files"));
  if (dirs.length === 0) {
    console.log("✓ docs-current: no committed API reference to check.");
    process.exit(0);
  }

  const problems = staleDocs(git("status", "--porcelain", "--", ...dirs));

  if (problems.length > 0) {
    console.error(`✗ the committed API reference does not match the source (${problems.length}):\n`);
    for (const p of problems) console.error(`  - ${p}`);
    console.error(
      "\nRun `rush docs` and commit the result. The reference is committed, so it carries the " +
        "authority of a reviewed file — a page describing an API that no longer exists sends a " +
        "reader to work around a problem that was already solved.\n",
    );
    process.exit(1);
  }

  console.log(`✓ docs-current: ${dirs.length} committed reference(s) match the source.`);
}
/* c8 ignore stop */
