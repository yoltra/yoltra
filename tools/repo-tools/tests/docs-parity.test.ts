import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * The end-user docs are written twice, in English and in Spanish, and each one points readers to
 * its full version on yoltra.dev. A translation that loses a section, a diagram or a link drifts
 * silently, and a link to the site that breaks the site's URL scheme lands on a 404. These checks
 * hold every pair to the same shape.
 */

const ROOT = join(__dirname, "..", "..", "..");

const GUIDES = [
  "QUICK_START_GUIDE",
  "MIGRATION_GUIDE",
  "TESTING_GUIDE",
  "NEXTJS_GUIDE",
  "DECORATION_GUIDE",
  "REQUEST_REPLY_GUIDE",
  "UPGRADE_0.10",
  "UPGRADE_0.8",
  "design/event-queue-architecture",
  "design/state-management-library-comparison",
];
const PACKAGES = [
  "packages/core",
  "packages/react",
  "packages/ds",
  "devtools/devtools-browser-agent",
  "devtools/devtools-cli",
  "devtools/devtools-ext",
  "devtools/devtools-protocol",
  "devtools/devtools-server",
  "devtools/devtools-storeview",
  "devtools/devtools-ui",
];

const PAIRS: [string, string][] = [
  ["README.md", "docs/es/README.md"],
  ...GUIDES.map((g): [string, string] => [`docs/en/${g}.md`, `docs/es/${g}.md`]),
  ...PACKAGES.map((p): [string, string] => [`${p}/README.md`, `${p}/README.es.md`]),
];

/** The text outside fenced code blocks, so a `## ` inside an example does not count. */
function prose(md: string): string {
  return md.replace(/^(```|~~~)[\s\S]*?^\1\s*$/gm, "");
}

const h2Count = (md: string) => prose(md).split("\n").filter((l) => /^## /.test(l)).length;
const mermaidCount = (md: string) => (md.match(/^```mermaid\s*$/gm) ?? []).length;
const siteLinks = (md: string) => [...md.matchAll(/https:\/\/yoltra\.dev\/[^\s)"'<>\]]*/g)].map((m) => m[0]);

/** The site's URL scheme: a language, then a library, the blog or the demos, or a static asset. */
const SITE_URL = /^https:\/\/yoltra\.dev\/(?:(?:en|es)\/(?:(?:yoltra|ds|pyyoltra|blog|demos)\/[^#]*\/|(?:yoltra|ds|pyyoltra|blog|demos)\/|)(?:#[^\s]*)?|assets\/[\w.-]+|brand\/[\w.-]+)$/;

describe.each(PAIRS)("%s and %s", (en, es) => {
  const read = (p: string) => readFileSync(join(ROOT, p), "utf8");

  it("both exist", () => {
    expect(existsSync(join(ROOT, en)), en).toBe(true);
    expect(existsSync(join(ROOT, es)), es).toBe(true);
  });

  it("have the same sections and diagrams", () => {
    expect(h2Count(read(es))).toBe(h2Count(read(en)));
    expect(mermaidCount(read(es))).toBe(mermaidCount(read(en)));
  });

  it("link the same pages on yoltra.dev, each in its own language", () => {
    const fromEn = siteLinks(read(en)).map((u) => u.replace("https://yoltra.dev/en/", "https://yoltra.dev/es/"));
    const fromEs = siteLinks(read(es));
    // Anchors are headings and differ by language; the pages must not.
    const page = (u: string) => u.split("#")[0];
    expect([...new Set(fromEs.map(page))].sort()).toEqual([...new Set(fromEn.map(page))].sort());
  });

  it("link the site only through its URL scheme", () => {
    for (const url of [...siteLinks(read(en)), ...siteLinks(read(es))]) expect(url).toMatch(SITE_URL);
  });
});
