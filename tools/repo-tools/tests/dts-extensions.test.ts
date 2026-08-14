import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import {
  maskComments,
  processDirs,
  resolveSpecifier,
  rewrite,
} from "../bin/dts-extensions.mjs";

/** Every specifier resolves; isolates the rewrite from the filesystem. */
const always = (spec: string) => `${spec}.js`;

/** Nothing resolves; isolates the failure path. */
const never = () => null;

const dirs: string[] = [];

function fixture(files: Record<string, string>): string {
  const root = mkdtempSync(join(tmpdir(), "dts-ext-"));
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

describe("rewrite", () => {
  it("adds an extension to every form TypeScript emits", () => {
    const source = [
      `export { A } from './a';`,
      `export * from "../b";`,
      `import type { C } from './nested/c';`,
      `declare const d: import("./d").D;`,
      `import './side-effect';`,
    ].join("\n");

    const { text, changed } = rewrite(source, always);

    expect(changed).toBe(true);
    expect(text).toContain(`from './a.js'`);
    expect(text).toContain(`from "../b.js"`);
    expect(text).toContain(`from './nested/c.js'`);
    expect(text).toContain(`import("./d.js")`);
    expect(text).toContain(`import './side-effect.js'`);
  });

  it("preserves the quote style it found", () => {
    expect(rewrite(`export * from './a';`, always).text).toBe(`export * from './a.js';`);
    expect(rewrite(`export * from "./a";`, always).text).toBe(`export * from "./a.js";`);
  });

  it("leaves bare package specifiers alone", () => {
    const source = `import { createStore } from '@yoltra/core';\nimport x from 'node:fs';`;
    expect(rewrite(source, always).changed).toBe(false);
  });

  it("is idempotent — an explicit specifier is never extended twice", () => {
    for (const spec of ["./a.js", "./a.mjs", "./a.cjs", "./a.json", "./a.node"]) {
      expect(rewrite(`export * from '${spec}';`, always).changed).toBe(false);
    }
  });

  it("reports an unresolvable specifier instead of guessing", () => {
    const { changed, unresolved } = rewrite(`export * from './gone';`, never);

    // The point of the failure: appending `.js` to a path that resolves to nothing would
    // trade a visible breakage for an invisible one.
    expect(changed).toBe(false);
    expect(unresolved).toEqual(["./gone"]);
  });

  it("does not touch a specifier quoted inside a comment", () => {
    const source = [
      `/**`,
      ` * @example`,
      ` * \`\`\`ts`,
      ` * import { thing } from './my-store';`,
      ` * \`\`\``,
      ` */`,
      `export * from './real';`,
    ].join("\n");

    const { text } = rewrite(source, always);

    expect(text).toContain(`from './my-store';`);
    expect(text).toContain(`from './real.js';`);
  });

  it("does not mistake a URL inside a string for a line comment", () => {
    // If `//` in "https://…" opened a comment, the specifier after it would be masked and
    // silently skipped.
    const source = `type Home = "https://yoltra.dev";\nexport * from './a';`;
    expect(rewrite(source, always).text).toContain(`from './a.js'`);
  });

  it("does not mistake a slash inside a template literal type for a comment", () => {
    const source = "type Glob = `${string}//${string}`;\nexport * from './a';";
    expect(rewrite(source, always).text).toContain(`from './a.js'`);
  });
});

describe("maskComments", () => {
  it("preserves length, so offsets index the original", () => {
    const source = `/* hi */ export * from './a';\n// tail`;
    expect(maskComments(source)).toHaveLength(source.length);
  });
});

describe("resolveSpecifier", () => {
  it("resolves a sibling declaration to a .js specifier", () => {
    const root = fixture({ "index.d.ts": "", "a.d.ts": "" });
    expect(resolveSpecifier(join(root, "index.d.ts"), "./a")).toBe("./a.js");
  });

  it("resolves a directory to its index", () => {
    const root = fixture({ "index.d.ts": "", "utils/index.d.ts": "" });
    expect(resolveSpecifier(join(root, "index.d.ts"), "./utils")).toBe("./utils/index.js");
  });

  it("answers null when nothing is there", () => {
    const root = fixture({ "index.d.ts": "" });
    expect(resolveSpecifier(join(root, "index.d.ts"), "./missing")).toBeNull();
  });
});

describe("processDirs", () => {
  it("rewrites a tree in place and reports what it touched", () => {
    const root = fixture({
      "index.d.ts": `export * from './a';\nexport * from './nested/b';`,
      "a.d.ts": `export declare const a: number;`,
      "nested/b.d.ts": `export * from '../a';`,
    });

    const { changed, problems } = processDirs([root]);

    expect(problems).toEqual([]);
    expect(changed).toHaveLength(2);
    expect(readFileSync(join(root, "index.d.ts"), "utf8")).toContain(`'./nested/b.js'`);
    expect(readFileSync(join(root, "nested/b.d.ts"), "utf8")).toContain(`'../a.js'`);
  });

  it("leaves the tree untouched under --check", () => {
    const root = fixture({ "index.d.ts": `export * from './a';`, "a.d.ts": "" });

    const { changed } = processDirs([root], { check: true });

    expect(changed).toHaveLength(1);
    expect(readFileSync(join(root, "index.d.ts"), "utf8")).toBe(`export * from './a';`);
  });

  it("names the file and specifier it could not resolve", () => {
    const root = fixture({ "index.d.ts": `export * from './gone';` });

    const { problems } = processDirs([root]);

    expect(problems).toHaveLength(1);
    expect(problems[0]).toContain("index.d.ts");
    expect(problems[0]).toContain("./gone");
  });

  it("treats a missing directory as nothing to do, not as an error", () => {
    expect(processDirs([join(tmpdir(), "definitely-not-here-yoltra")])).toEqual({
      changed: [],
      problems: [],
    });
  });
});
