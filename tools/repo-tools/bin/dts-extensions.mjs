#!/usr/bin/env node
/**
 * Adds explicit `.js` extensions to the relative module specifiers of emitted declaration files.
 *
 * Run per package after `vite build`. TypeScript emits declarations with whatever the source
 * wrote, and the sources here write extensionless relative imports. In a package that declares
 * `"type": "module"`, the emitted `.d.ts` is read in ESM mode, where an extensionless relative
 * specifier does not resolve: TypeScript reports TS2834 for each one.
 *
 * That would be tolerable if it were loud. It is not. Nearly every project sets
 * `skipLibCheck: true`, which suppresses the errors and keeps the damage: **every re-exported
 * symbol degrades to `any`.** The consumer gets a green build, no editor completions, and no
 * type checking on any of our APIs — a worse outcome than a hard failure, because nothing
 * about it looks like a failure.
 *
 * Appending `.js` is correct in *both* resolution modes — TypeScript maps `./x.js` to `./x.d.ts`
 * under `node10`, `node16`/`nodenext` and `bundler` alike — so this runs over every package
 * regardless of its `type` field, and needs no per-package configuration.
 *
 * Usage:
 *   node dts-extensions.mjs [dir...]     rewrite in place (default dir: dist/types)
 *   node dts-extensions.mjs --check      report only; exit 1 if anything would change
 *
 * A specifier that resolves to nothing on disk is never guessed at: the run fails and names
 * the file and the specifier, because silently appending `.js` to a broken path would trade
 * one invisible breakage for another.
 */

import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, dirname, resolve as resolvePath } from "node:path";

/** Extensions that mean the specifier is already explicit and must be left alone. */
const EXPLICIT = [".js", ".mjs", ".cjs", ".json", ".node", ".d.ts", ".d.mts", ".d.cts"];

/**
 * Positions of module specifiers: `from "…"`, `import("…")` in type position, and the bare
 * side-effect `import "…"`. Only relative ones (leading `.`) are captured.
 */
const SPECIFIER = /(\bfrom\s*|\bimport\s*\(\s*|\bimport\s+)(["'])(\.[^"'\n]*)\2/g;

/**
 * Blanks out comments so a specifier quoted inside a JSDoc `@example` is never rewritten,
 * while every byte offset in the original is preserved.
 *
 * Walking rather than regex-replacing because the two constructs nest each way round: `//` is
 * not a comment inside `"http://x"`, and a quote is not a string inside `/* … *​/`. Template
 * literals count as strings too — declaration files are full of template literal *types*
 * (`` `${string}*${string}` ``), and a `//` inside one is data.
 *
 * @param {string} source
 * @returns {string} same length as `source`, comment bytes replaced with spaces
 */
export function maskComments(source) {
  const out = source.split("");
  let i = 0;

  while (i < source.length) {
    const c = source[i];
    const next = source[i + 1];

    // String or template literal: skip to its close, honouring backslash escapes.
    if (c === '"' || c === "'" || c === "`") {
      i++;
      while (i < source.length) {
        if (source[i] === "\\") {
          i += 2;
          continue;
        }
        if (source[i] === c) {
          i++;
          break;
        }
        i++;
      }
      continue;
    }

    if (c === "/" && next === "/") {
      while (i < source.length && source[i] !== "\n") out[i++] = " ";
      continue;
    }

    if (c === "/" && next === "*") {
      out[i++] = " ";
      out[i++] = " ";
      while (i < source.length && !(source[i] === "*" && source[i + 1] === "/")) {
        if (source[i] !== "\n") out[i] = " ";
        i++;
      }
      if (i < source.length) {
        out[i++] = " ";
        out[i++] = " ";
      }
      continue;
    }

    i++;
  }

  return out.join("");
}

/** @param {string} specifier */
function isExplicit(specifier) {
  return EXPLICIT.some((ext) => specifier.endsWith(ext));
}

/**
 * Resolves a relative specifier against the declaration file that wrote it.
 *
 * @param {string} dtsPath - absolute path of the `.d.ts` doing the importing
 * @param {string} specifier - e.g. `"./eventBus/EventBus"`
 * @returns {string | null} the rewritten specifier, or `null` if it resolves to nothing
 */
export function resolveSpecifier(dtsPath, specifier) {
  const base = resolvePath(dirname(dtsPath), specifier);

  // A file: `./x` → `./x.js`, alongside `x.d.ts`.
  if (existsSync(`${base}.d.ts`)) return `${specifier}.js`;

  // A directory with a barrel: `./x` → `./x/index.js`.
  if (existsSync(join(base, "index.d.ts"))) return `${specifier}/index.js`;

  return null;
}

/**
 * Rewrites one declaration file's contents.
 *
 * @param {string} source
 * @param {(specifier: string) => string | null} resolver
 * @returns {{ text: string, changed: boolean, unresolved: string[] }}
 */
export function rewrite(source, resolver) {
  const masked = maskComments(source);
  const unresolved = [];
  /** @type {Array<{ start: number, end: number, replacement: string }>} */
  const edits = [];

  for (const match of masked.matchAll(SPECIFIER)) {
    const specifier = match[3];
    if (isExplicit(specifier)) continue;

    const resolved = resolver(specifier);
    if (resolved === null) {
      unresolved.push(specifier);
      continue;
    }

    // Offsets come from the mask, which is the same length as the source, so they index the
    // original directly. Only the specifier itself is replaced — the `from`/`import` prefix and
    // the quote style are left exactly as emitted.
    const quote = match[2];
    const start = match.index + match[1].length + quote.length;
    edits.push({ start, end: start + specifier.length, replacement: resolved });
  }

  if (edits.length === 0) return { text: source, changed: false, unresolved };

  // Applied back-to-front so earlier offsets stay valid.
  let text = source;
  for (const edit of edits.reverse()) {
    text = text.slice(0, edit.start) + edit.replacement + text.slice(edit.end);
  }

  return { text, changed: true, unresolved };
}

/**
 * Every `.d.ts` under `dir`, recursively.
 *
 * @param {string} dir
 * @returns {string[]}
 */
export function findDeclarations(dir) {
  if (!existsSync(dir)) return [];
  /** @type {string[]} */
  const found = [];

  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) found.push(...findDeclarations(full));
    else if (entry.endsWith(".d.ts")) found.push(full);
  }

  return found;
}

/**
 * Rewrites (or, with `check`, only inspects) every declaration under the given directories.
 *
 * @param {string[]} dirs
 * @param {{ check?: boolean }} [opts]
 * @returns {{ changed: string[], problems: string[] }}
 */
export function processDirs(dirs, opts = {}) {
  /** @type {string[]} */
  const changed = [];
  /** @type {string[]} */
  const problems = [];

  for (const dir of dirs) {
    for (const file of findDeclarations(dir)) {
      const source = readFileSync(file, "utf8");
      const result = rewrite(source, (spec) => resolveSpecifier(file, spec));

      for (const spec of result.unresolved) {
        problems.push(`${file}: "${spec}" resolves to no file — cannot add an extension`);
      }

      if (!result.changed) continue;
      changed.push(file);
      if (!opts.check) writeFileSync(file, result.text);
    }
  }

  return { changed, problems };
}

/* c8 ignore start — CLI wiring, exercised by the build rather than by unit tests */
const invokedDirectly =
  process.argv[1] !== undefined &&
  import.meta.url === new URL(`file://${resolvePath(process.argv[1])}`).href;

if (invokedDirectly) {
  const args = process.argv.slice(2);
  const check = args.includes("--check");
  const dirs = args.filter((a) => !a.startsWith("--"));
  const targets = dirs.length > 0 ? dirs : ["dist/types"];

  const { changed, problems } = processDirs(targets, { check });

  if (problems.length > 0) {
    console.error("✗ dts-extensions: unresolvable relative specifiers\n");
    for (const p of problems) console.error(`  - ${p}`);
    process.exit(1);
  }

  if (check) {
    if (changed.length > 0) {
      console.error(
        `✗ dts-extensions: ${changed.length} declaration file(s) still carry extensionless ` +
          `relative specifiers:\n`,
      );
      for (const f of changed) console.error(`  - ${f}`);
      process.exit(1);
    }
    console.log("✓ dts-extensions: all relative specifiers are explicit.");
  } else if (changed.length > 0) {
    console.log(`✓ dts-extensions: added extensions in ${changed.length} declaration file(s).`);
  }
}
/* c8 ignore stop */
