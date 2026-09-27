import { describe, expect, it } from "vitest";

import { compiledStyles } from "../support/styles";
import { themeCss } from "../../src/tokens/css";

/**
 * The CSS this package publishes, recorded byte for byte.
 *
 * @remarks
 * These snapshots exist because the stylesheets are the public contract and nothing else
 * guards their content. `styles.test.ts` proves every `var(--yl-*)` resolves to a property the
 * tokens define, which is a strong check and still blind to the two things that actually go
 * wrong: a hardcoded value creeping back in, and a token change quietly restyling a component
 * nobody was looking at. Both are obvious in a diff and invisible in an assertion.
 *
 * Written as `.css` files rather than into a `.snap` because a stylesheet escaped onto one line
 * is not reviewable, and review is the entire point. The filenames match `dist/styles/`, so a
 * snapshot sits beside the published artefact it describes.
 *
 * jsdom computes no styles, so nothing here renders. These assert what the sass compiler emits,
 * which is the layer a unit test can reach.
 */

/**
 * The sheets this suite covers, listed rather than discovered.
 *
 * @remarks
 * Deliberately hardcoded. Deriving it from the same scan the subject uses would make the count
 * self-satisfying, so adding or deleting a stylesheet has to be a deliberate edit here. In CI a
 * deleted snapshot already fails on its own, because vitest resolves `updateSnapshot` to
 * `"none"` when `CI` is set; this list is what covers the local case, where a missing snapshot
 * is written instead.
 */
const EXPECTED_SHEETS = [
  "base.scss",
  "Badge.scss",
  "Button.scss",
  "Callout.scss",
  "Card.scss",
  "CodeBlock.scss",
  "Feedback.scss",
  "Field.scss",
  "Form.scss",
  "Layout.scss",
  "Table.scss",
  "Tabs.scss",
  "Typography.scss",
  "Modal.scss",
  "Popover.scss",
  "Tooltip.scss",
];

/** `Button.scss` becomes `button.css`, the name `build-styles.mjs` publishes it under. */
const published = (scss: string) => `${scss.replace(/\.scss$/, "").toLowerCase()}.css`;

describe("the compiled stylesheets", () => {
  const sheets = compiledStyles();

  it("are exactly the sheets this suite claims to cover", () => {
    expect(sheets.map((s) => s.name)).toEqual(EXPECTED_SHEETS);
  });

  it("each compile to something, so an empty snapshot cannot pass as a match", () => {
    for (const { name, css } of sheets) {
      expect(css.length, name).toBeGreaterThan(100);
      expect(css, name).toContain("{");
    }
  });

  for (const { name, css } of sheets) {
    it(`${name} emits the recorded CSS`, async () => {
      await expect(`${css}\n`).toMatchFileSnapshot(`./__snapshots__/${published(name)}`);
    });
  }
});

describe("the token sheet", () => {
  // Every combination the public signature allows. `rootFontSize: false` is the one
  // `build-styles.mjs` writes to `tokens.css`, and `scoped` is what an application embedding
  // these components inside a page it does not own has to use.
  const variants = [
    { label: "tokens", options: {} },
    { label: "tokens-no-root", options: { rootFontSize: false } },
    { label: "tokens-scoped", options: { scoped: true } },
    { label: "tokens-scoped-no-root", options: { scoped: true, rootFontSize: false } },
  ] as const;

  for (const { label, options } of variants) {
    it(`emits the recorded properties for ${label}`, async () => {
      await expect(`${themeCss(options)}\n`).toMatchFileSnapshot(`./__snapshots__/${label}.css`);
    });
  }

  it("defines enough properties that a broken emitter would not pass", () => {
    const names = new Set([...themeCss().matchAll(/(--yl-[a-z0-9-]+)\s*:/g)].map((m) => m[1]!));
    expect(names.size).toBeGreaterThan(50);
  });
});
