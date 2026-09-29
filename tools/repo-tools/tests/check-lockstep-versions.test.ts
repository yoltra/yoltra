import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { checkLockstep } from "../bin/check-lockstep-versions.mjs";

/** The tool is untyped `.mjs`; this is the shape its assertions rely on. */
interface Member {
  name: string;
  version: string | null;
}

/**
 * A lock-step policy is a promise that a set of packages moves as one, and nothing enforced it.
 *
 * The way it comes apart: `rush version --bump` applies the policy, while `rush publish --apply`
 * bumps each package from its own change files and does not know the policy exists. A release
 * where one member has a `minor` entry and another has only a `patch` one then produces a split
 * suite from a command that exits zero.
 *
 * These assert the broken state is caught, whatever produced it.
 */

const dirs: string[] = [];

/** Builds a repository-shaped tree: `rush.json`, the policy file, and each package's manifest. */
function fixture(
  policies: unknown[],
  projects: Array<{ packageName: string; projectFolder: string; versionPolicyName?: string }>,
  versions: Record<string, string>,
): string {
  const root = mkdtempSync(join(tmpdir(), "lockstep-"));
  dirs.push(root);

  mkdirSync(join(root, "common/config/rush"), { recursive: true });
  // Written with comments on purpose: both real files are JSONC, and the policy file leads with a
  // block comment. A reader that cannot handle them fails on the repository it is meant to guard.
  writeFileSync(
    join(root, "common/config/rush/version-policies.json"),
    `/**\n * Version policies.\n */\n${JSON.stringify(policies, null, 2)}\n`,
  );
  writeFileSync(
    join(root, "rush.json"),
    `// See https://rushjs.io/pages/configs/rush_json/\n${JSON.stringify({ projects }, null, 2)}\n`,
  );

  for (const p of projects) {
    const version = versions[p.packageName];
    if (version === undefined) continue;
    mkdirSync(join(root, p.projectFolder), { recursive: true });
    writeFileSync(
      join(root, p.projectFolder, "package.json"),
      JSON.stringify({ name: p.packageName, version }, null, 2),
    );
  }
  return root;
}

const suite = [
  { policyName: "suite", definitionName: "lockStepVersion", version: "0.9.0", nextBump: "minor" },
  { policyName: "solo", definitionName: "individualVersion" },
];

const projects = [
  { packageName: "@x/core", projectFolder: "packages/core", versionPolicyName: "suite" },
  { packageName: "@x/react", projectFolder: "packages/react", versionPolicyName: "suite" },
  { packageName: "@x/ds", projectFolder: "packages/ds", versionPolicyName: "solo" },
  { packageName: "@x/tool", projectFolder: "tools/tool" },
];

afterEach(() => {
  for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true });
});

describe("checkLockstep", () => {
  it("passes when every member is on the policy version", () => {
    const root = fixture(suite, projects, {
      "@x/core": "0.9.0",
      "@x/react": "0.9.0",
      "@x/ds": "0.4.0",
      "@x/tool": "1.2.3",
    });

    expect(checkLockstep(root).failures).toEqual([]);
  });

  it("catches the split a per-package bump produces", () => {
    // The exact shape: core had a `minor` change file and react only a `patch` one.
    const root = fixture(suite, projects, {
      "@x/core": "0.9.0",
      "@x/react": "0.8.1",
      "@x/ds": "0.4.0",
      "@x/tool": "1.2.3",
    });

    const { failures } = checkLockstep(root);
    expect(failures).toHaveLength(1);
    expect(failures[0]!.policy).toBe("suite");
    expect(failures[0]!.disagree.map((m: Member) => m.name)).toEqual(["@x/react"]);
  });

  it("catches members that agree with each other but not with the policy", () => {
    // A bump applied by something that moved the packages and left the policy behind. The set is
    // internally consistent, so comparing members to each other would call this healthy.
    const root = fixture(suite, projects, {
      "@x/core": "0.8.0",
      "@x/react": "0.8.0",
      "@x/ds": "0.4.0",
      "@x/tool": "1.2.3",
    });

    const { failures } = checkLockstep(root);
    expect(failures).toHaveLength(1);
    expect(failures[0]!.disagree).toHaveLength(2);
  });

  it("ignores packages outside a lock-step policy", () => {
    // `individualVersion` and unpolicied packages version on their own; constraining them would
    // make the check wrong rather than strict.
    const root = fixture(suite, projects, {
      "@x/core": "0.9.0",
      "@x/react": "0.9.0",
      "@x/ds": "0.1.0",
      "@x/tool": "7.7.7",
    });

    expect(checkLockstep(root).failures).toEqual([]);
  });

  it("reports a member whose manifest is missing rather than skipping it", () => {
    // A project listed in rush.json with no package.json is a broken repository, and silently
    // passing would be the wrong answer from a check that exists to notice exactly this class.
    const root = fixture(suite, projects, { "@x/core": "0.9.0", "@x/ds": "0.4.0" });

    const { failures } = checkLockstep(root);
    expect(failures).toHaveLength(1);
    const missing = failures[0]!.members.find((m: Member) => m.name === "@x/react");
    expect(missing!.version).toBeNull();
  });
});
