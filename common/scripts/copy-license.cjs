// Rush prepublishOnly helper
// ─────────────────────────────────────────────────────────────────────────────
// Copies the root LICENSE file into the current package directory so every
// published package includes a proper license file.
//
// Usage in package.json:
//   "prepublishOnly": "node ../../common/scripts/copy-license.cjs"
//
// Safe to run: exits cleanly when already at the root or when there is nothing
// to copy.
// ─────────────────────────────────────────────────────────────────────────────
"use strict";

const path = require("path");
const fs = require("fs");

const packageDir = process.cwd();
const rootDir = path.resolve(__dirname, "../../");

if (packageDir === rootDir) {
  // Running at the repo root — nothing to do.
  process.exit(0);
}

const src = path.join(rootDir, "LICENSE");
const dst = path.join(packageDir, "LICENSE");

if (!fs.existsSync(src)) {
  console.error(`[copy-license] ERROR: LICENSE not found at ${src}`);
  process.exit(1);
}

fs.copyFileSync(src, dst);
console.log(`[copy-license] Copied LICENSE → ${path.relative(rootDir, dst)}`);
