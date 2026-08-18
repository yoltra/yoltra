import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { checkAliases } from "../bin/check-example-aliases.mjs";

const dirs: string[] = [];

/** Builds an `examples`-shaped tree: `<root>/<project>/vite.config.ts` plus any real files. */
function fixture(files: Record<string, string>): string {
  const root = mkdtempSync(join(tmpdir(), "aliases-"));
  dirs.push(root);
  for (const [rel, contents] of Object.entries(files)) {
    const full = join(root, rel);
    mkdirSync(join(full, ".."), { recursive: true });
    writeFileSync(full, contents);
  }
  return root;
}

afterEach(() => {
  for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true });
});

describe("checkAliases", () => {
  it("passes when every alias target exists", () => {
    const root = fixture({
      "packages/core/dist/yoltra.mjs": "//",
      "app/vite.config.ts": `const a = { "@yoltra/core": fromHere("../packages/core/dist/yoltra.mjs") };`,
    });

    expect(checkAliases([root])).toEqual({ checked: 1, problems: [] });
  });

  it("names an alias that points at nothing", () => {
    // The exact failure that reached a maintainer: a package renamed its build output and the
    // example's alias kept pointing at the old name.
    const root = fixture({
      "packages/core/dist/yoltra.mjs": "//",
      "app/vite.config.ts": `const a = { "@yoltra/core": fromHere("../packages/core/dist/yoltra.esm.js") };`,
    });

    const { problems } = checkAliases([root]);

    expect(problems).toHaveLength(1);
    expect(problems[0]).toContain("vite.config.ts");
    expect(problems[0]).toContain("yoltra.esm.js");
  });

  it("checks every project, not just the first", () => {
    const root = fixture({
      "one/vite.config.ts": `fromHere("../missing-one.mjs")`,
      "two/vite.config.ts": `fromHere("../missing-two.mjs")`,
    });

    expect(checkAliases([root]).problems).toHaveLength(2);
  });

  it("finds a directory target, which is a legitimate alias", () => {
    // `@yoltra/ds/styles` aliases a directory rather than a file.
    const root = fixture({
      "packages/ds/dist/styles/index.css": "",
      "app/vite.config.ts": `fromHere("../packages/ds/dist/styles")`,
    });

    expect(checkAliases([root]).problems).toEqual([]);
  });

  it("ignores a project without a vite config, and a missing root", () => {
    const root = fixture({ "docs/readme.md": "# not a project" });

    expect(checkAliases([root])).toEqual({ checked: 0, problems: [] });
    expect(checkAliases([join(tmpdir(), "definitely-not-here-yoltra")])).toEqual({
      checked: 0,
      problems: [],
    });
  });
});
