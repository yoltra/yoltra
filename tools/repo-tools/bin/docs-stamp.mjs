#!/usr/bin/env node
/**
 * Stamps the Yoltra logo onto every markdown file TypeDoc emits.
 *
 * Run per package after `typedoc`, as the last step of the `docs` script. The generated API
 * reference is committed, and every page is meant to carry the logo — but TypeDoc rewrites the
 * whole tree on each run, so a stamp applied by hand survives exactly until the next
 * regeneration. That is what happened: `@yoltra/core` and `@yoltra/react` were stamped manually
 * and every other package was missed, and the next `rushx docs` in either would have silently
 * removed all 96.
 *
 * The stamp is the logo and a blank line, prepended. Nothing else — no version, no date. These
 * trees are committed, and the typedoc configs already refuse churn on purpose (`includeVersion`
 * is off, `sourceLinkTemplate` is pinned to `main`, both with comments explaining that a
 * whole-file diff reads as churn and gets committed by accident). Anything that moves per release
 * would rewrite every page in the repo for no reader's benefit.
 *
 * Usage:
 *   node docs-stamp.mjs [dir...]     stamp in place (default dir: docs)
 *   node docs-stamp.mjs --check      report only; exit 1 if anything is unstamped
 *
 * Note that `rushx docs:md` on its own leaves the output unstamped — only the full `docs` chain
 * runs this. That is why `docs:stamp` exists as its own script: the remedy is one command rather
 * than a full regeneration.
 */

import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join } from "node:path";

/** The stamp, byte for byte as it already appears in the committed core and react trees. */
export const LOGO = "![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)";

/** Logo, blank line, then whatever TypeDoc wrote. `\n` only — `.gitattributes` sets `eol=lf`. */
export const STAMP = `${LOGO}\n\n`;

/**
 * Whether a file already carries the stamp.
 *
 * @remarks
 * Tests the *beginning* of the file rather than searching it. A page that merely mentions the
 * asset URL — a TSDoc `@example` showing how to embed the logo, say — would match a substring
 * search, and would then be skipped forever while looking like it had been handled. The stamp is
 * a position, not a presence.
 *
 * @param {string} source
 * @returns {boolean}
 */
export function isStamped(source) {
  return source.startsWith(LOGO);
}

/**
 * Returns the stamped form of a document, or the document unchanged if it already carries one.
 *
 * @param {string} source
 * @returns {{ text: string, changed: boolean }}
 */
export function stamp(source) {
  if (isStamped(source)) return { text: source, changed: false };
  return { text: STAMP + source, changed: true };
}

/**
 * Every `.md` under `dir`, recursively. TypeDoc nests output by symbol kind (`functions/`,
 * `interfaces/`, `type-aliases/`), and `@yoltra/ds` nests deeper still.
 *
 * @param {string} dir
 * @returns {string[]}
 */
export function findMarkdown(dir) {
  if (!existsSync(dir)) return [];
  /** @type {string[]} */
  const found = [];

  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) found.push(...findMarkdown(full));
    else if (entry.endsWith(".md")) found.push(full);
  }

  return found;
}

/**
 * Stamps (or, with `check`, only inspects) every document under the given directories.
 *
 * A directory that does not exist is nothing to do rather than an error: several packages define
 * a `docs` script and a `typedoc.json` but have never generated output, and the stamp step must
 * not fail there before TypeDoc has ever run.
 *
 * @param {string[]} dirs
 * @param {{ check?: boolean }} [opts]
 * @returns {{ changed: string[] }}
 */
export function processDirs(dirs, opts = {}) {
  /** @type {string[]} */
  const changed = [];

  for (const dir of dirs) {
    for (const file of findMarkdown(dir)) {
      const result = stamp(readFileSync(file, "utf8"));
      if (!result.changed) continue;
      changed.push(file);
      if (!opts.check) writeFileSync(file, result.text);
    }
  }

  return { changed };
}

/* c8 ignore start — CLI wiring, exercised by the docs build rather than by unit tests */
const invokedDirectly =
  process.argv[1] !== undefined && import.meta.url.endsWith(process.argv[1].replace(/\\/g, "/"));

if (invokedDirectly) {
  const args = process.argv.slice(2);
  const check = args.includes("--check");
  const dirs = args.filter((a) => !a.startsWith("--"));
  const targets = dirs.length > 0 ? dirs : ["docs"];

  const { changed } = processDirs(targets, { check });

  if (check) {
    if (changed.length > 0) {
      console.error(`✗ docs-stamp: ${changed.length} file(s) missing the logo:\n`);
      for (const f of changed) console.error(`  - ${f}`);
      console.error(`\nRun the package's \`docs:stamp\` script to add it.`);
      process.exit(1);
    }
    console.log("✓ docs-stamp: every document carries the logo.");
  } else if (changed.length > 0) {
    console.log(`✓ docs-stamp: stamped ${changed.length} file(s).`);
  }
}
/* c8 ignore stop */
