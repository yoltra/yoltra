/**
 * Smoke test for the published flat config.
 *
 * A shared ESLint config is loaded by every consumer at lint time, so a config that throws on
 * import, or that resolves to something ESLint cannot read, breaks linting everywhere at once.
 * Nothing else in this package could catch that: it ships no source to unit-test.
 *
 * Deliberately dependency-free. Pulling vitest in to assert three properties would add a test
 * runner and a coverage provider to a package that is one file.
 */
import assert from "node:assert/strict";

import config from "./index.js";

assert.ok(Array.isArray(config), "the flat config must be an array");
assert.ok(config.length > 0, "the flat config must not be empty");

for (const [i, entry] of config.entries()) {
  assert.equal(typeof entry, "object", `entry ${i} must be an object`);
  assert.notEqual(entry, null, `entry ${i} must not be null`);
}

// The package exists to carry rules; a config that resolved but declared none would lint
// nothing while every consumer's CI still reported success.
assert.ok(
  config.some((entry) => entry.rules && Object.keys(entry.rules).length > 0),
  "at least one entry must declare rules",
);

console.log(`ok: flat config loads, ${config.length} entries`);
