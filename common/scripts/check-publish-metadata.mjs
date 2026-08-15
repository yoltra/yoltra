#!/usr/bin/env node
// Pre-publish guard: nothing else in CI or the release path looks at what is actually inside
// the tarball, which is how four separate consumer-facing defects shipped green at 0.4.0. Run
// this BEFORE `rush publish` so a failure surfaces pre-tag rather than after some packages
// have already gone live, leaving a partial release.
//
// It checks four things, each of which has already been wrong once:
//
//   1. repository.url matches the source repo — npm Trusted Publishing (provenance) rejects a
//      mismatch with E422.
//   2. No published .d.ts carries an extensionless relative specifier. Under a "type": "module"
//      package those do not resolve, and because nearly everyone sets `skipLibCheck: true` the
//      errors are suppressed while every re-exported symbol silently degrades to `any`.
//   3. `exports.import` resolves to a file Node will parse as ESM and `exports.require` to one
//      it will parse as CommonJS, judged by extension against the package's `type` field. A
//      "type": "module" package pointing `require` at `.cjs.js` throws `exports is not defined`
//      on the consumer's first line.
//   4. Every `//# sourceMappingURL` names a file the tarball actually contains — asked of
//      `npm pack` itself rather than by re-implementing `files` glob semantics.
//
// Usage: node common/scripts/check-publish-metadata.mjs
// Exits non-zero and lists every offending package.

import { readFileSync, existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join, dirname, posix } from "node:path";
import { fileURLToPath } from "node:url";

import { processDirs } from "../../tools/repo-tools/bin/dts-extensions.mjs";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

// rush.json is JSONC (comments + trailing commas). Strip both without touching
// string literals (so the https:// $schema URL survives), then JSON.parse.
function parseJsonc(text) {
  const noComments = text.replace(
    /("(?:\\.|[^"\\])*")|\/\/[^\n]*|\/\*[\s\S]*?\*\//g,
    (_m, str) => (str ? str : ""),
  );
  return JSON.parse(noComments.replace(/,(\s*[}\]])/g, "$1"));
}

/**
 * The formats Node infers from a file's extension, given the package's `type`. `.mjs`/`.cjs`
 * say it outright; a bare `.js` inherits, which is exactly the ambiguity that broke both
 * directions at 0.4.0.
 */
function formatOf(file, pkgType) {
  if (file.endsWith(".mjs")) return "esm";
  if (file.endsWith(".cjs")) return "cjs";
  if (file.endsWith(".js")) return pkgType === "module" ? "esm" : "cjs";
  return "unknown";
}

/** Every `{ condition, target }` pair under a package's `exports`, at any nesting. */
function* conditionTargets(node, path = "exports") {
  if (typeof node !== "object" || node === null) return;
  for (const [key, value] of Object.entries(node)) {
    if (typeof value === "string") yield { condition: key, target: value, path: `${path}.${key}` };
    else yield* conditionTargets(value, `${path}.${key}`);
  }
}

/** The file list npm itself would publish, so `files` globs are never re-implemented here. */
function packedFiles(folder) {
  const out = execFileSync("npm", ["pack", "--dry-run", "--json"], {
    cwd: folder,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"],
  });
  return new Set((JSON.parse(out)[0]?.files ?? []).map((f) => f.path));
}

const rush = parseJsonc(readFileSync(join(repoRoot, "rush.json"), "utf8"));

// Read from rush.json rather than keeping a second copy here. The value has to be right in both
// places or npm rejects the publish, and two constants that must agree are a pair that will
// eventually disagree. Absent is a hard stop: comparing every package against `undefined` would
// report all of them as broken, or none, depending on which way the check was written.
const EXPECTED = rush.repository?.url;
if (!EXPECTED) {
  console.error(
    '✗ rush.json has no "repository.url". It is the baseline for `rush change` and the URL npm ' +
      "Trusted Publishing matches against; this check reads it from there. Add it before publishing.",
  );
  process.exit(1);
}

const problems = [];
let checkedDist = 0;

for (const project of rush.projects) {
  const folder = join(repoRoot, project.projectFolder);
  const pkgPath = join(folder, "package.json");
  if (!existsSync(pkgPath)) continue;
  const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));

  if (pkg.private) continue; // not published — skip
  if (project.shouldPublish === false) continue;

  // 1. Provenance metadata.
  const url =
    typeof pkg.repository === "string" ? pkg.repository : pkg.repository?.url;

  if (!url) {
    problems.push(`${pkg.name}: missing "repository.url" (needed for npm provenance)`);
  } else if (url !== EXPECTED) {
    problems.push(`${pkg.name}: repository.url is "${url}", expected "${EXPECTED}"`);
  }

  // The remaining checks read the build output. A package that has not been built yet is
  // reported rather than skipped — `rush build` precedes `rush publish`, so an absent `dist`
  // at this point means the release is not ready, not that there is nothing to check.
  const typesEntry = pkg.types ?? pkg.typings;
  if (!typesEntry) continue;

  const typesDir = join(folder, dirname(typesEntry));
  if (!existsSync(typesDir)) {
    problems.push(`${pkg.name}: ${typesEntry} is missing — run \`rush build\` before publishing`);
    continue;
  }
  checkedDist++;

  // 2. Declaration specifiers are explicit. `--check` semantics: nothing is written, and a file
  // that *would* change is a file whose specifiers do not resolve in ESM mode.
  const { changed, problems: unresolvable } = processDirs([typesDir], { check: true });
  for (const file of changed) {
    problems.push(
      `${pkg.name}: ${posix.relative(folder, file)} has extensionless relative specifiers ` +
        `— run the package's build (its \`dts-extensions\` step adds them)`,
    );
  }
  for (const p of unresolvable) problems.push(`${pkg.name}: ${p}`);

  // 3. Each export condition resolves to a file Node parses the way the condition promises.
  for (const { condition, target, path } of conditionTargets(pkg.exports)) {
    const want = condition === "import" ? "esm" : condition === "require" ? "cjs" : null;
    if (want === null) continue;

    const format = formatOf(target, pkg.type);
    if (format !== want) {
      problems.push(
        `${pkg.name}: ${path} points at "${target}", which Node parses as ` +
          `${format === "unknown" ? "neither ESM nor CJS" : format.toUpperCase()} ` +
          `(package "type" is ${pkg.type ?? "unset"}) — a "${condition}" condition must be ` +
          `${want.toUpperCase()}. Use an explicit .mjs/.cjs extension.`,
      );
    }
  }

  // 4. Referenced sourcemaps are actually in the tarball.
  let packed;
  try {
    packed = packedFiles(folder);
  } catch (err) {
    problems.push(`${pkg.name}: could not run \`npm pack --dry-run\` (${err.message})`);
    continue;
  }

  for (const file of packed) {
    if (!/\.(js|mjs|cjs)$/.test(file)) continue;
    const contents = readFileSync(join(folder, file), "utf8");
    const ref = /\/\/# sourceMappingURL=(\S+)/.exec(contents);
    if (!ref || ref[1].startsWith("data:")) continue;

    const mapPath = posix.join(posix.dirname(file), ref[1]);
    if (!packed.has(mapPath)) {
      problems.push(
        `${pkg.name}: ${file} references "${ref[1]}", which the tarball does not contain — ` +
          `every consumer's test run prints an ENOENT for it. Ship the map or drop the comment.`,
      );
    }
  }
}

if (problems.length) {
  console.error("✗ Pre-publish check failed:\n");
  for (const p of problems) console.error(`  - ${p}`);
  process.exit(1);
}

console.log(
  `✓ Publish metadata, declarations, export conditions and sourcemaps check out ` +
    `(${checkedDist} packages inspected).`,
);
