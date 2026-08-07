import { describe, expect, it } from "vitest";

import {
  compareWithBaseline,
  formatComparisons,
  readSamples,
  toBaseline,
} from "../src/bench-baseline";

const report = {
  files: [
    {
      groups: [
        {
          fullName: "file.bench.ts > objects",
          benchmarks: [
            { name: "wide", hz: 1000, mean: 1 },
            { name: "deep", hz: 2000, mean: 0.5 },
          ],
        },
      ],
    },
  ],
};

describe("reading a run", () => {
  it("keys on group and name, not position", () => {
    // Position-keyed comparison silently pairs two unrelated measurements the moment somebody
    // inserts a benchmark.
    expect(readSamples(report).map((s) => s.id)).toEqual(["objects > wide", "objects > deep"]);
  });

  it("refuses an empty report rather than reporting nothing wrong", () => {
    expect(() => readSamples({ files: [] })).toThrow(/no benchmarks/);
  });
});

describe("comparing", () => {
  const baseline = toBaseline(readSamples(report));

  it("calls an unchanged run steady", () => {
    const result = compareWithBaseline(readSamples(report), baseline);
    expect(result.every((c) => c.status === "steady")).toBe(true);
  });

  it("flags a slowdown beyond the tolerance", () => {
    const slower = readSamples(report).map((s) => ({ ...s, hz: s.hz * 0.5 }));
    const [first] = compareWithBaseline(slower, baseline);
    expect(first!.status).toBe("slower");
    expect(first!.ratio).toBeCloseTo(0.5);
  });

  it("treats a small dip as noise", () => {
    // Machine-to-machine variance on these is large; a threshold tighter than the noise
    // reports nothing but noise.
    const dipped = readSamples(report).map((s) => ({ ...s, hz: s.hz * 0.9 }));
    expect(compareWithBaseline(dipped, baseline).every((c) => c.status === "steady")).toBe(true);
  });

  it("marks a benchmark the baseline has never seen", () => {
    const added = [...readSamples(report), { id: "objects > fresh", hz: 5, meanMs: 1 }];
    const fresh = compareWithBaseline(added, baseline).find((c) => c.id === "objects > fresh");
    expect(fresh?.status).toBe("new");
    expect(fresh?.ratio).toBeNull();
  });
});

describe("output", () => {
  it("counts what regressed", () => {
    const baseline = toBaseline(readSamples(report));
    const slower = readSamples(report).map((s) => ({ ...s, hz: s.hz * 0.4 }));
    const text = formatComparisons(compareWithBaseline(slower, baseline));

    expect(text).toContain("SLOWER");
    expect(text).toContain("2 benchmarks, 2 slower, 0 new");
  });
});
