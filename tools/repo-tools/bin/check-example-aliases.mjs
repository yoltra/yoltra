#!/usr/bin/env node
/**
 * Verifies that every path an example's vite config aliases actually exists.
 *
 * The examples consume Yoltra straight from each package's built `dist` rather than through an
 * install, by aliasing every `@yoltra/*` specifier to a file path. That keeps them honest about
 * what ships — but it also means a rename in a package silently orphans an alias in a directory
 * nothing else looks at.
 *
 * Which is exactly what happened. Renaming the build outputs to `.mjs`/`.cjs` left **eight**
 * dangling aliases across three examples, and none of `rush build`, `rush test`, `rush lint` or
 * `rush typecheck` noticed: a vite alias is resolved by the dev server, so the failure only
 * appears when somebody opens the app. It reached the maintainer that way.
 *
 * Worse, the sweep meant to catch it did not. It was
 * `grep -rn "\.esm\.js" . | grep -v "/dist/"` — where the `-v` was intended to skip built output
 * and instead skipped every *source reference to* built output, which is the only thing being
 * looked for. A check that reads the configs and resolves what they point at cannot make that
 * mistake.
 *
 * Usage:
 *   node check-example-aliases.mjs [glob-dir...]   default: examples/v0
 *
 * Exits non-zero listing every alias that resolves to nothing.
 */

import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { resolve, dirname, join } from "node:path";

/**
 * Aliases are written as `fromHere("../../../packages/core/dist/yoltra.mjs")` — a helper each
 * example defines to resolve against its own config file. Matching the helper rather than the
 * `alias` object keeps this indifferent to how the object is spelled or spread.
 */
const ALIAS = /fromHere\(\s*["']([^"']+)["']\s*\)/g;

/** Every `vite.config.*` beneath `dir`, one level of projects deep. */
function findConfigs(dir) {
  if (!existsSync(dir)) return [];
  const found = [];

  for (const entry of readdirSync(dir)) {
    const project = join(dir, entry);
    if (!statSync(project).isDirectory()) continue;
    for (const file of readdirSync(project)) {
      if (/^vite\.config\.(m?[jt]s)$/.test(file)) found.push(join(project, file));
    }
  }

  return found;
}

/**
 * @returns `{ checked, problems }` — problems name the config, the alias, and where it pointed.
 */
export function checkAliases(dirs) {
  const problems = [];
  let checked = 0;

  for (const dir of dirs) {
    for (const config of findConfigs(dir)) {
      const source = readFileSync(config, "utf8");
      for (const match of source.matchAll(ALIAS)) {
        const target = resolve(dirname(config), match[1]);
        checked++;
        if (existsSync(target)) continue;
        problems.push(`${config}\n      aliases "${match[1]}"\n      → ${target} does not exist`);
      }
    }
  }

  return { checked, problems };
}

/* c8 ignore start — CLI wiring */
const invokedDirectly =
  process.argv[1] !== undefined && import.meta.url.endsWith(process.argv[1].replace(/\\/g, "/"));

if (invokedDirectly) {
  const dirs = process.argv.slice(2).filter((a) => !a.startsWith("--"));
  const { checked, problems } = checkAliases(dirs.length > 0 ? dirs : ["examples/v0"]);

  if (problems.length > 0) {
    console.error(`✗ ${problems.length} example alias(es) point at nothing:\n`);
    for (const p of problems) console.error(`  - ${p}\n`);
    console.error(
      "An example aliases packages by file path, so a rename in a package orphans them " +
        "silently — the dev server is the only thing that resolves an alias.\n",
    );
    process.exit(1);
  }

  console.log(`✓ all ${checked} example alias targets resolve.`);
}
/* c8 ignore stop */
