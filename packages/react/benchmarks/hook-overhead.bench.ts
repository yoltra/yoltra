/**
 * The two per-render costs the tracker suspected but never measured.
 *
 * @remarks
 * Both findings say "measure first", and both are cheap to be wrong about in the expensive
 * direction: caching either one adds a lookup, a key and an eviction story to a hot path. The
 * numbers decide it.
 *
 * Read them against the store work they sit beside — a commit on a hundred-key slice is
 * roughly 47 microseconds in the core benchmarks.
 */

import { bench, describe } from "vitest";

import { specsSignature, toDottedPath } from "../src/utils/path";

const specs = (n: number) =>
  Array.from({ length: n }, (_, i) => ({ reducer: "todo", property: `field${i}` }));

describe("specsSignature, per render", () => {
  for (const n of [1, 5, 20]) {
    const value = specs(n);
    bench(`${n} spec(s)`, () => {
      specsSignature(value);
    });
  }

  const twenty = specs(20);
  bench("20 specs, JSON.stringify for comparison", () => {
    // What the Suspense variant uses today, and the reason the finding pairs them.
    JSON.stringify(twenty);
  });
});

describe("accessor to dotted path, per render", () => {
  bench("shallow: p => p.title", () => {
    toDottedPath((p: Record<string, unknown>) => p.title);
  });

  bench("deep: p => p.a.b.c.d.e", () => {
    // The proxy records member access, so the accessor is typed loosely on purpose: what is
    // being measured is the walk, not the shape it walks.
    toDottedPath((p: any) => p.a.b.c.d.e);
  });
});
