/**
 * Comparing a benchmark run against a committed baseline.
 *
 * @remarks
 * Reporting, not gating — at least until the variance on a shared runner is known. A
 * benchmark gate that fails intermittently teaches people to bypass it, which is the same
 * reasoning that put the coverage thresholds at measured floors rather than aspirations.
 *
 * Pure functions; `bin/bench-check.cjs` owns the files and the process exit.
 *
 * @module
 */

/** One measurement, keyed by its group and name. */
export interface BenchSample {
  readonly id: string;
  /** Operations per second. Higher is faster. */
  readonly hz: number;
  /** Mean duration in milliseconds. */
  readonly meanMs: number;
}

/** A committed set of measurements. */
export interface Baseline {
  readonly recordedAt?: string;
  readonly samples: Readonly<Record<string, { hz: number; meanMs: number }>>;
}

/** How one benchmark compares with its baseline. */
export interface Comparison {
  readonly id: string;
  readonly baselineHz: number | null;
  readonly currentHz: number;
  /** Ratio of current to baseline. Below 1 is slower. */
  readonly ratio: number | null;
  readonly status: "faster" | "steady" | "slower" | "new";
}

/** Vitest's `--outputJson` shape, as far as this reads it. */
interface RawReport {
  files?: Array<{
    groups?: Array<{
      fullName?: string;
      benchmarks?: Array<{ name: string; hz: number; mean: number }>;
    }>;
  }>;
}

/**
 * Flattens a vitest benchmark report into comparable samples.
 *
 * @remarks
 * Keyed by `group > name` rather than by position, so reordering or inserting a benchmark
 * does not silently compare two unrelated measurements.
 */
export function readSamples(raw: unknown): readonly BenchSample[] {
  const report = raw as RawReport;
  const samples: BenchSample[] = [];

  for (const file of report.files ?? []) {
    for (const group of file.groups ?? []) {
      const groupName = (group.fullName ?? "").split(" > ").pop() ?? "";
      for (const benchmark of group.benchmarks ?? []) {
        samples.push({
          id: `${groupName} > ${benchmark.name}`,
          hz: benchmark.hz,
          meanMs: benchmark.mean,
        });
      }
    }
  }

  if (samples.length === 0) throw new Error("no benchmarks in the report");
  return samples;
}

/** Builds a baseline from a run. */
export function toBaseline(samples: readonly BenchSample[], recordedAt?: string): Baseline {
  return {
    ...(recordedAt !== undefined ? { recordedAt } : {}),
    samples: Object.fromEntries(samples.map((s) => [s.id, { hz: s.hz, meanMs: s.meanMs }])),
  };
}

/**
 * Compares a run with a baseline.
 *
 * @param tolerance - Fractional slowdown treated as noise. `0.25` means a benchmark must be
 * more than 25% slower before it is called a regression — machine-to-machine variance on
 * these is large, and a threshold tighter than the noise reports nothing but noise.
 */
export function compareWithBaseline(
  samples: readonly BenchSample[],
  baseline: Baseline,
  tolerance = 0.25,
): readonly Comparison[] {
  return samples.map((sample) => {
    const recorded = baseline.samples[sample.id];
    if (recorded === undefined) {
      return { id: sample.id, baselineHz: null, currentHz: sample.hz, ratio: null, status: "new" };
    }

    const ratio = sample.hz / recorded.hz;
    const status = ratio < 1 - tolerance ? "slower" : ratio > 1 + tolerance ? "faster" : "steady";
    return { id: sample.id, baselineHz: recorded.hz, currentHz: sample.hz, ratio, status };
  });
}

/** A table, with the regressions and the new entries called out. */
export function formatComparisons(comparisons: readonly Comparison[]): string {
  const rows = comparisons.map((c) => {
    const mark = { slower: "SLOWER", faster: "faster", steady: "  ok  ", new: " new  " }[c.status];
    const ratio = c.ratio === null ? "     —" : `${c.ratio.toFixed(2)}x`;
    return `  ${mark} ${c.id.padEnd(56)} ${Math.round(c.currentHz).toLocaleString().padStart(12)} hz  ${ratio}`;
  });
  const slower = comparisons.filter((c) => c.status === "slower").length;
  const fresh = comparisons.filter((c) => c.status === "new").length;
  return `${rows.join("\n")}\n\n  ${comparisons.length} benchmarks, ${slower} slower, ${fresh} new`;
}
