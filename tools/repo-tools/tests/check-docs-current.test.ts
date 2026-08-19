import { describe, expect, it } from "vitest";

import { committedDocsDirs, staleDocs } from "../bin/check-docs-current.mjs";

describe("committedDocsDirs", () => {
  it("derives directories from the index rather than a hard-coded list", () => {
    const lsFiles = [
      "packages/core/docs/README.md",
      "packages/core/docs/classes/Store.md",
      "packages/react/docs/README.md",
      "devtools/devtools-protocol/docs/README.md",
      "packages/core/src/index.ts",
      "README.md",
    ].join("\n");

    expect(committedDocsDirs(lsFiles)).toEqual([
      "devtools/devtools-protocol/docs",
      "packages/core/docs",
      "packages/react/docs",
    ]);
  });

  it("ignores a package that generates docs but does not commit them", () => {
    // Every package with a `docs` script now commits its output, so this case is currently
    // hypothetical. It is kept because the guard has to stay correct for a package that adds
    // the script before it decides to track the result: `rush docs` would create the directory,
    // and failing on output nobody chose to commit would report drift that does not exist.
    expect(committedDocsDirs("packages/core/src/index.ts\ndevtools/devtools-ui/src/App.tsx")).toEqual(
      [],
    );
  });

  it("does not mistake a path merely containing 'docs' for a docs directory", () => {
    const lsFiles = ["packages/core/src/docs-helper.ts", "docs/en/DEVELOPER_GUIDE.md"].join("\n");

    expect(committedDocsDirs(lsFiles)).toEqual([]);
  });
});

describe("staleDocs", () => {
  it("reports a page whose content no longer matches the source", () => {
    expect(staleDocs(" M packages/core/docs/classes/Store.md")).toEqual([
      "packages/core/docs/classes/Store.md — out of date",
    ]);
  });

  it("reports a page that does not exist yet, which git diff would miss", () => {
    // The drift that actually happened: a release added public API, so the new pages were
    // untracked rather than modified. `git diff --exit-code` reports clean on exactly this.
    expect(staleDocs("?? packages/core/docs/interfaces/EmitResult.md")).toEqual([
      "packages/core/docs/interfaces/EmitResult.md — missing from the committed reference",
    ]);
  });

  it("handles a mixed run and ignores blank lines", () => {
    const porcelain = [
      " M packages/core/docs/README.md",
      "?? packages/core/docs/functions/Rejected.md",
      "",
    ].join("\n");

    expect(staleDocs(porcelain)).toHaveLength(2);
  });

  it("says nothing when the reference matches", () => {
    expect(staleDocs("")).toEqual([]);
    expect(staleDocs("\n  \n")).toEqual([]);
  });
});
