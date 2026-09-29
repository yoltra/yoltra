#!/usr/bin/env node
/**
 * Verifies that every member of a lock-step version policy is actually on that version.
 *
 * A `lockStepVersion` policy exists so a set of packages moves as one: `@yoltra/core`,
 * `@yoltra/react` and the devtools libraries share a version because they are released, installed
 * and supported together, and a consumer pinning one has to be able to reason about the rest.
 *
 * Nothing enforced it. The policy is a declaration in `version-policies.json`, and the version
 * that ships is whatever sits in each `package.json` — two facts that can disagree, silently, in
 * a commit nobody reads closely because it is called "chore(release)".
 *
 * **The way they come apart.** `rush version --bump` applies the policy and moves the whole set.
 * `rush publish --apply` computes a bump per package from its change files, so a release where
 * core has a `minor` entry and react has only a `patch` one produces core 0.9.0 beside react
 * 0.8.1 — a split suite, from a command that looks like the right one and exits zero. Running it
 * on this repository's 0.9.0 tree previews exactly that, for `@yoltra/react`,
 * `@yoltra/devtools-cli` and `@yoltra/devtools-server`.
 *
 * Which command is correct is settled in RELEASING.md. This check does not care: it reports the
 * broken *state*, so a hand-edited `package.json`, a bad merge, or a half-finished bump is caught
 * on the same footing as the wrong command.
 *
 * The policy's own `version` field is included in the comparison. `rush version --bump` advances
 * it alongside its members, so a set that agrees with each other and not with the policy means
 * the bump was applied by something that did not know the policy existed.
 *
 * Usage:
 *   node check-lockstep-versions.mjs          report and exit non-zero on any disagreement
 *   node check-lockstep-versions.mjs --json   same, machine-readable
 *
 * Exits 0 when every lock-step policy is internally consistent.
 */

import { readFileSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";
import process from "node:process";
import console from "node:console";

/**
 * Reads a Rush config file.
 *
 * @remarks
 * Rush configs are JSONC: `rush.json` and `version-policies.json` both carry block and line
 * comments, and `version-policies.json` leads with a `/** ... *\/` describing the policies. A
 * plain `JSON.parse` throws on them, so the comments are stripped first — string-aware, because
 * a `//` inside a URL is not a comment and one of these files contains several.
 */
function readJsonc(file) {
  const text = readFileSync(file, "utf8");
  let out = "";
  let inString = false;
  let inLine = false;
  let inBlock = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    const next = text[i + 1];

    if (inLine) {
      if (c === "\n") { inLine = false; out += c; }
      continue;
    }
    if (inBlock) {
      if (c === "*" && next === "/") { inBlock = false; i++; }
      continue;
    }
    if (inString) {
      out += c;
      if (c === "\\") { out += text[++i] ?? ""; continue; }
      if (c === '"') inString = false;
      continue;
    }
    if (c === '"') { inString = true; out += c; continue; }
    if (c === "/" && next === "/") { inLine = true; i++; continue; }
    if (c === "/" && next === "*") { inBlock = true; i++; continue; }
    out += c;
  }
  return JSON.parse(out);
}

/**
 * Every lock-step policy in `repoRoot`, with its members and each member's real version.
 *
 * @param repoRoot - Directory holding `rush.json` and `common/config/rush/version-policies.json`.
 */
export function collectLockstep(repoRoot) {
  const policies = readJsonc(join(repoRoot, "common/config/rush/version-policies.json"));
  const rush = readJsonc(join(repoRoot, "rush.json"));

  const lockstep = new Map();
  for (const p of policies) {
    if (p.definitionName !== "lockStepVersion") continue;
    lockstep.set(p.policyName, { declared: p.version, members: [] });
  }

  for (const project of rush.projects) {
    const policy = lockstep.get(project.versionPolicyName);
    if (policy === undefined) continue;

    const manifest = join(repoRoot, project.projectFolder, "package.json");
    if (!existsSync(manifest)) {
      policy.members.push({ name: project.packageName, version: null, missing: manifest });
      continue;
    }
    policy.members.push({
      name: project.packageName,
      version: JSON.parse(readFileSync(manifest, "utf8")).version,
    });
  }
  return lockstep;
}

/**
 * Which lock-step policies disagree with themselves.
 *
 * @param repoRoot - Repository root.
 * @returns `policies`, and a `failures` entry per policy whose members are not all on its version.
 */
export function checkLockstep(repoRoot) {
  const policies = collectLockstep(repoRoot);
  const failures = [];

  for (const [policy, { declared, members }] of policies) {
    if (members.length === 0) continue;
    const disagree = members.filter((m) => m.version !== declared);
    if (disagree.length > 0) failures.push({ policy, declared, members, disagree });
  }
  return { policies, failures };
}

/* c8 ignore start — CLI wiring */
const invokedDirectly =
  process.argv[1] !== undefined && import.meta.url.endsWith(process.argv[1].replace(/\\/g, "/"));

if (invokedDirectly) {
  const repoRoot = resolve(new URL("../../..", import.meta.url).pathname);
  const asJson = process.argv.includes("--json");
  const { policies, failures } = checkLockstep(repoRoot);

  if (asJson) {
    console.log(JSON.stringify({ ok: failures.length === 0, failures }, null, 2));
    process.exit(failures.length === 0 ? 0 : 1);
  }

  if (failures.length === 0) {
    const summary = [...policies]
      .map(([n, p]) => `${n} @ ${p.declared} (${p.members.length} packages)`)
      .join(", ");
    console.log(`✓ lock-step versions agree: ${summary}`);
    process.exit(0);
  }

  for (const { policy, declared, members, disagree } of failures) {
    console.error(`✗ lock-step policy "${policy}" declares ${declared}, and its members disagree:\n`);
    for (const m of members) {
      const mark = m.version === declared ? " " : "✗";
      console.error(`  ${mark} ${m.name.padEnd(34)} ${m.version ?? `(no package.json at ${m.missing})`}`);
    }
    console.error(
      `\n  ${disagree.length} of ${members.length} are off the policy version.\n` +
        `  A lock-step set is released and supported together, so a consumer pinning one has to be\n` +
        `  able to reason about the rest. Split versions make that untrue.\n\n` +
        `  Most likely cause: the release was applied with \`rush publish --apply\`, which bumps each\n` +
        `  package from its own change files and does not know the policy. RELEASING.md specifies\n` +
        `  \`rush version --bump\`, which moves the set together. To repair:\n\n` +
        `      rush version --ensure-version-policy --version-policy ${policy}\n`,
    );
  }
  process.exit(1);
}
/* c8 ignore stop */
