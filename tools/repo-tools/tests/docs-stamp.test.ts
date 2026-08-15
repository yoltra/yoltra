import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { LOGO, STAMP, isStamped, processDirs, stamp } from "../bin/docs-stamp.mjs";

const dirs: string[] = [];

function fixture(files: Record<string, string>): string {
  const root = mkdtempSync(join(tmpdir(), "docs-stamp-"));
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

describe("stamp", () => {
  it("prepends the logo and a blank line, leaving the document untouched", () => {
    const doc = "# createStore\n\nBuilds a store.\n";
    const { text, changed } = stamp(doc);

    expect(changed).toBe(true);
    expect(text).toBe(`${LOGO}\n\n${doc}`);
    // The original bytes survive intact — this is a prepend, never a reformat.
    expect(text.slice(STAMP.length)).toBe(doc);
  });

  it("is idempotent", () => {
    // The guard for the ~96 files already committed with a stamp: a run over them has to be a
    // no-op, not a second stamp and not a rewrite.
    const once = stamp("# Title\n").text;
    const twice = stamp(once);

    expect(twice.changed).toBe(false);
    expect(twice.text).toBe(once);
  });

  it("stamps a document that merely mentions the logo URL in its body", () => {
    // A substring search would treat this page as already stamped and skip it forever, while
    // looking like it had been handled. The stamp is a position, not a presence.
    const doc = "# Branding\n\nEmbed it with `![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)`.\n";

    expect(isStamped(doc)).toBe(false);
    expect(stamp(doc).changed).toBe(true);
    expect(stamp(doc).text.startsWith(STAMP)).toBe(true);
  });

  it("uses LF, never CRLF", () => {
    // `.gitattributes` sets `* text=auto eol=lf` repo-wide; a CRLF stamp would show up as a
    // whole-file diff on the next checkout.
    expect(STAMP).toBe(`${LOGO}\n\n`);
    expect(STAMP).not.toContain("\r");
  });
});

describe("processDirs", () => {
  it("stamps a nested tree and reports what it touched", () => {
    const root = fixture({
      "README.md": "# @yoltra/core\n",
      "functions/createStore.md": "# createStore\n",
      "interfaces/nested/StoreSpec.md": "# StoreSpec\n",
      "assets/logo.png": "not markdown",
    });

    const { changed } = processDirs([root]);

    expect(changed).toHaveLength(3);
    expect(readFileSync(join(root, "interfaces/nested/StoreSpec.md"), "utf8")).toBe(
      `${STAMP}# StoreSpec\n`,
    );
    // Non-markdown is left alone.
    expect(readFileSync(join(root, "assets/logo.png"), "utf8")).toBe("not markdown");
  });

  it("reports nothing on a second run", () => {
    const root = fixture({ "README.md": "# Title\n" });

    expect(processDirs([root]).changed).toHaveLength(1);
    expect(processDirs([root]).changed).toHaveLength(0);
  });

  it("leaves the tree untouched under --check", () => {
    const root = fixture({ "README.md": "# Title\n" });

    const { changed } = processDirs([root], { check: true });

    expect(changed).toHaveLength(1);
    expect(readFileSync(join(root, "README.md"), "utf8")).toBe("# Title\n");
  });

  it("treats a missing directory as nothing to do, not as an error", () => {
    // Several packages define a `docs` script and a typedoc.json but have never generated
    // output. The stamp step must not fail there before TypeDoc has ever run.
    expect(processDirs([join(tmpdir(), "definitely-not-here-yoltra-docs")])).toEqual({
      changed: [],
    });
  });

  it("accepts several directories in one run", () => {
    const a = fixture({ "README.md": "# A\n" });
    const b = fixture({ "README.md": "# B\n" });

    expect(processDirs([a, b]).changed).toHaveLength(2);
  });
});
