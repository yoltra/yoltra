#!/usr/bin/env node
/**
 * Package the built extension into a Chrome Web Store–ready .zip.
 *
 * Zips the CONTENTS of dist/ (so manifest.json sits at the zip root, as the
 * Web Store requires) into store/yoltra-devtools-<version>.zip. Zero npm deps —
 * shells out to the system `zip`. Run `pnpm build` first (or use `pnpm package`,
 * which builds then packs).
 */
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, rmSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const extRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const distDir = join(extRoot, "dist");
const storeDir = join(extRoot, "store");

function fail(msg) {
  console.error(`✗ ${msg}`);
  process.exit(1);
}

// Preconditions
try {
  execFileSync("zip", ["-v"], { stdio: "ignore" });
} catch {
  fail("`zip` is not installed. Install it (e.g. `sudo apt-get install zip`) and retry.");
}
if (!existsSync(join(distDir, "manifest.json"))) {
  fail("dist/manifest.json not found — run `pnpm build` first (or `pnpm package`).");
}

// Version from the built manifest (source of truth for the store).
const version = JSON.parse(readFileSync(join(distDir, "manifest.json"), "utf8")).version;
if (!version) fail("No `version` field in dist/manifest.json.");

mkdirSync(storeDir, { recursive: true });
const zipName = `yoltra-devtools-${version}.zip`;
const zipPath = join(storeDir, zipName);
if (existsSync(zipPath)) rmSync(zipPath);

// Zip the dist CONTENTS (cwd = dist, path = ".") so manifest.json is at the root.
// -r recurse, -X strip extra file attributes for a reproducible archive.
execFileSync("zip", ["-r", "-X", "-q", zipPath, "."], { cwd: distDir, stdio: "inherit" });

const { size } = (await import("node:fs")).statSync(zipPath);
console.log(`✓ Packaged Yoltra DevTools v${version}`);
console.log(`  ${join("store", zipName)}  (${(size / 1024).toFixed(1)} KB)`);
console.log("  Upload this .zip at https://chrome.google.com/webstore/devconsole");
