import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import { SRC } from "./support/styles";

/**
 * Every component documents itself, and the check is mechanical.
 *
 * @remarks
 * A documentation rule that lives only in a contributing guide is a rule that holds until the
 * first hurried afternoon. This one fails the build instead. It is deliberately shallow: it
 * cannot tell whether a README is *correct*, only whether it exists, names its component and
 * shows the component being used. Four claims in the first batch written here were wrong about
 * their own component's defaults, and no assertion of this kind would have caught them, which is
 * worth knowing rather than glossing over: reading the source is still the reviewer's job.
 */

/** A component is a directory holding a `.tsx` of the same name. */
function componentDirs(): Array<{ name: string; dir: string }> {
  const tiers = ["primitives", "overlay", "theme"];
  return tiers.flatMap((tier) =>
    readdirSync(path.join(SRC, tier), { withFileTypes: true })
      .filter((e) => e.isDirectory())
      .map((e) => ({ name: e.name, dir: path.join(SRC, tier, e.name) }))
      .filter(({ name, dir }) => readdirSync(dir).includes(`${name}.tsx`)),
  );
}

describe("every component carries a README", () => {
  const components = componentDirs();

  it("finds the components at all, so a bad glob cannot make this vacuous", () => {
    // Twenty-two today. A number rather than a floor: adding one should be a deliberate edit here,
    // which is the moment somebody remembers the README.
    expect(components.length).toBe(22);
    expect(components.map((c) => c.name)).toContain("Button");
    expect(components.map((c) => c.name)).toContain("ThemeProvider");
  });

  for (const { name, dir } of components) {
    describe(name, () => {
      const readme = path.join(dir, "README.md");

      it("exists and is titled after the component", () => {
        const text = readFileSync(readme, "utf8");
        expect(text.startsWith(`# ${name}\n`)).toBe(true);
      });

      it("shows an import and at least one example", () => {
        const text = readFileSync(readme, "utf8");
        // The import line is what a reader needs first, and for this package it also answers the
        // question the export map raises: main entry or `/client`.
        expect(text).toContain("@yoltra/ds");
        const fences = (text.match(/```/g) ?? []).length;
        expect(fences, "expected fenced examples").toBeGreaterThanOrEqual(4);
        expect(fences % 2, "an unclosed code fence").toBe(0);
      });

      it("shows something the module actually exports", () => {
        // Checked against the module's exports rather than the directory name, because five of
        // these are families: `Feedback` exports Spinner, `Field` exports Input, `Modal` exports
        // Dialog. Requiring the directory name would have failed all five and taught the next
        // person to rename a heading rather than write an example.
        const source = readFileSync(path.join(dir, `${name}.tsx`), "utf8");
        const exported = [...source.matchAll(/export (?:function|const) ([A-Za-z][A-Za-z0-9]*)/g)]
          .map((m) => m[1]!)
          .filter((n) => /^[A-Z]|^use/.test(n));
        expect(exported.length, "no exports found, so this assertion proves nothing").toBeGreaterThan(0);

        const examples = readFileSync(readme, "utf8")
          .split("```")
          .filter((_, i) => i % 2 === 1)
          .join("\n");
        expect(
          exported.some((n) => examples.includes(n)),
          `examples mention none of: ${exported.join(", ")}`,
        ).toBe(true);
      });
    });
  }
});
