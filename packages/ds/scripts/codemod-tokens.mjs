#!/usr/bin/env node
/**
 * Rewrites 0.3.x `--yl-*` custom-property names to their 0.4.0 equivalents.
 *
 * Usage:
 *   node scripts/codemod-tokens.mjs 'src/**\/*.scss'        # report only
 *   node scripts/codemod-tokens.mjs --write 'app/**\/*.css'  # rewrite in place
 *
 * Works on any text file, so a `.css`, `.scss`, `.ts` or `.tsx` that names a property in a
 * string or an inline style is covered too.
 *
 * The one subtlety worth knowing: a replacement is anchored so that a shorter name cannot eat a
 * longer one. `--yl-color-border` became `--yl-color-border-subtle`, while
 * `--yl-color-border-strong` and `--yl-color-border-focus` kept their names, so a naive
 * search-and-replace would turn `--yl-color-border-strong` into
 * `--yl-color-border-subtle-strong`. Every pattern therefore refuses to match when another name
 * character follows, which also makes the order of the map irrelevant.
 */
// `process` and `console` are imported rather than taken from the global scope, matching
// `build-styles.mjs`: the repository's lint config grants Node globals to `.ts` and `.tsx` only,
// so a script that reaches for the ambient ones fails `no-undef`.
import console from "node:console";
import { globSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const { renames, judgement } = JSON.parse(
  readFileSync(path.join(here, "token-rename-map.json"), "utf8"),
);

const args = process.argv.slice(2);
const write = args.includes("--write");
const patterns = args.filter((a) => !a.startsWith("--"));

if (patterns.length === 0) {
  console.error("usage: codemod-tokens.mjs [--write] <glob...>");
  process.exit(2);
}

/** `--yl-color-border` must not match inside `--yl-color-border-strong`. */
const rules = Object.entries(renames).map(([from, to]) => ({
  from,
  to,
  re: new RegExp(`${from.replace(/[-]/g, "\\-")}(?![-\\w])`, "g"),
}));

const files = patterns.flatMap((p) => globSync(p, { nodir: true }));
if (files.length === 0) {
  console.error(`no files matched: ${patterns.join(" ")}`);
  process.exit(1);
}

let touched = 0;
let total = 0;
const judged = new Map();

for (const file of files) {
  const before = readFileSync(file, "utf8");
  let after = before;
  const hits = [];
  for (const { from, to, re } of rules) {
    const n = (after.match(re) ?? []).length;
    if (n === 0) continue;
    after = after.replace(re, to);
    hits.push(`${from} -> ${to} (${n})`);
    total += n;
    if (judgement?.[from]) judged.set(from, (judged.get(from) ?? 0) + n);
  }
  if (after === before) continue;
  touched += 1;
  console.log(`${write ? "rewrote" : "would rewrite"} ${file}`);
  for (const h of hits) console.log(`    ${h}`);
  if (write) writeFileSync(file, after);
}

console.log(
  `\n${write ? "rewrote" : "would rewrite"} ${touched} of ${files.length} file(s), ${total} replacement(s)`,
);

for (const [from, n] of judged) {
  const j = judgement[from];
  console.log(`\nreview ${n} replacement(s) of ${from}:`);
  console.log(`  ${j.why}`);
  for (const [name, when] of Object.entries(j["use-instead"])) {
    console.log(`    ${name} — ${when}`);
  }
}
