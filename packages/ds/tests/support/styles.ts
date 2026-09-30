import { readdirSync } from "node:fs";
import path from "node:path";
import * as sass from "sass-embedded";

/**
 * Compiles the stylesheets the package ships, for the suites that assert against real CSS.
 *
 * @remarks
 * This lives outside a `.test.ts` file because two suites need it: the token-contract checks in
 * `styles.test.ts` and the CSS snapshots in `snapshots/css.test.ts`. Duplicating the compile
 * would double the slowest thing in the package's test run.
 *
 * Memoized deliberately. Sass compilation is that slow part, and calling it per assertion
 * recompiled every file each time, which was enough to time the suite out under a parallel run.
 * The memo is per worker rather than per run, because vitest isolates test files.
 */

/** Absolute path to the package's `src`, which is also the sass load path. */
export const SRC = path.resolve(__dirname, "..", "..", "src");

/** A compiled stylesheet, named by its source file. */
export interface CompiledStyle {
  readonly name: string;
  readonly css: string;
}

let compiled: CompiledStyle[] | null = null;

/** Every stylesheet the package ships, compiled once per worker. */
export function compiledStyles(): CompiledStyle[] {
  return (compiled ??= compileAll());
}

/** Every `.scss` beneath a directory, at any depth. */
function scssIn(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return scssIn(full);
    return entry.name.endsWith(".scss") ? [full] : [];
  });
}

function compileAll(): CompiledStyle[] {
  // `.trim()` mirrors `scripts/build-styles.mjs`, which trims and then writes a single trailing
  // newline. Matching it here is what lets a CSS snapshot be compared directly against the file
  // in `dist/styles/` rather than being merely similar to it.
  const compile = (file: string) =>
    sass.compile(file, { loadPaths: [SRC], style: "expanded" }).css.trim();

  // Both directories that hold component styles. Scanning only `primitives` would have left
  // the overlay tier, the one that leans hardest on tokens, unchecked. Recursive, because a
  // component owns a directory: `primitives/Button/Button.scss`.
  const dirs = ["primitives", "overlay"].map((d) => path.join(SRC, d));
  return [
    { name: "base.scss", css: compile(path.join(SRC, "styles", "base.scss")) },
    ...dirs
      .flatMap(scssIn)
      .sort((a, b) => path.basename(a).localeCompare(path.basename(b)))
      .map((file) => ({ name: path.basename(file), css: compile(file) })),
  ];
}
