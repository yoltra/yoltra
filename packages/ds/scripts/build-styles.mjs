#!/usr/bin/env node
/**
 * Compiles the SASS sources into one stylesheet per component, and generates the token
 * stylesheet from the TypeScript tokens.
 *
 * Run after `vite build`, because the token sheet is produced by importing the built bundle —
 * `foundationTokens` and the themes are TypeScript, and duplicating their values in SCSS
 * would create a second source of truth that drifts the first time somebody edits one.
 *
 * Emits:
 *   dist/styles/tokens.css        custom properties, both themes
 *   dist/styles/base.css          10px root, .yl-root, .yl-container, .yl-visually-hidden
 *   dist/styles/base-no-root.css  the same without the root font-size declaration
 *   dist/styles/<component>.css   one per primitive
 *   dist/styles/all.css           every one of the above, for consumers who want it
 */

import { readdirSync, mkdirSync, writeFileSync } from "node:fs";
import process from "node:process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as sass from "sass-embedded";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const out = path.join(root, "dist", "styles");
mkdirSync(out, { recursive: true });

const compile = (file) =>
  sass.compile(file, { loadPaths: [path.join(root, "src")], style: "expanded" }).css.trim();

/** `Button.scss` -> `button.css`, so an import path reads like the component it styles. */
const cssName = (file) => `${path.basename(file, ".scss").toLowerCase()}.css`;

const written = [];
const write = (name, css) => {
  writeFileSync(path.join(out, name), `${css}\n`);
  written.push(name);
  return css;
};

// Tokens, from the built bundle so the TypeScript stays authoritative.
const { themeCss } = await import(path.join(root, "dist", "index.mjs"));
const tokens = write("tokens.css", themeCss({ rootFontSize: false }));

// Base, in both flavours: an application that sets its own root font size needs the rest of
// the base sheet without ours overriding it.
const base = compile(path.join(root, "src", "styles", "base.scss"));
write("base.css", base);
write("base-no-root.css", base.replace(/html\s*\{[^}]*font-size:\s*62\.5%[^}]*\}\s*/, ""));

// One per component, across every directory that holds them.
const sourceDirs = ["primitives", "overlay"].map((d) => path.join(root, "src", d));
const components = sourceDirs
  .flatMap((dir) =>
    readdirSync(dir)
      .filter((f) => f.endsWith(".scss"))
      .map((f) => path.join(dir, f)),
  )
  .sort((a, b) => path.basename(a).localeCompare(path.basename(b)))
  .map((file) => write(cssName(file), compile(file)));

write(
  "all.css",
  [tokens, base, ...components].join("\n\n"),
);

process.stdout.write(`styles: ${written.length} files -> dist/styles\n`);
