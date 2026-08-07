/**
 * Reads React DevTools Profiler exports and computes the figures the comparison
 * documentation publishes.
 *
 * @remarks
 * The captures in `examples/v0/yoltra-in-react/public/assets/profiler` are the strongest
 * evidence in this repository for the claim the library is built on, and until now the
 * numbers quoted from them were transcribed by hand. Nothing regenerated them, nothing
 * checked them, and nothing would have noticed them going stale.
 *
 * Everything here is pure: it takes parsed JSON and returns numbers. Reading files and
 * writing output belongs to `bin/profiler-report.cjs`, so the arithmetic can be tested
 * without touching a disk.
 *
 * @module
 */

/** One commit, as the profiler recorded it. */
export interface CommitSummary {
  /** Position in `commitData`, from zero. */
  readonly index: number;
  /** Position as the documentation labels it, from one. */
  readonly frame: number;
  readonly durationMs: number;
  /** How many fibers React actually rendered in this commit. */
  readonly fibers: number;
}

/** One profiling session. */
export interface CaptureSummary {
  readonly label: string;
  readonly commits: number;
  readonly totalMs: number;
  readonly perCommit: readonly CommitSummary[];
}

/** A contiguous run of commits, which is how the documentation quotes the toggle work. */
export interface WindowSummary {
  readonly fromFrame: number;
  readonly toFrame: number;
  readonly commits: number;
  readonly totalMs: number;
  readonly meanMs: number;
  /**
   * Fibers per commit across the window, or `null` when it varies.
   *
   * @remarks
   * `null` matters: the documentation quotes a single number, and it may only do so while
   * every commit in the window agrees. A window that varies has no such number, and saying
   * so is better than quoting a mean nobody can act on.
   */
  readonly fibers: number | null;
}

/** Both sessions, side by side. */
export interface Comparison {
  readonly yoltra: CaptureSummary;
  readonly rtk: CaptureSummary;
  readonly window: {
    readonly fromFrame: number;
    readonly toFrame: number;
    readonly yoltra: WindowSummary;
    readonly rtk: WindowSummary;
  };
}

/** Shape of the export, as far as this tool depends on it. */
interface RawCapture {
  version?: number;
  dataForRoots?: Array<{
    commitData?: Array<{
      duration?: number;
      fiberActualDurations?: unknown;
    }>;
  }>;
}

/** The export schema this tool understands. */
export const SUPPORTED_PROFILER_VERSION = 5;

/**
 * Counts rendered fibers in one commit.
 *
 * @remarks
 * The field is an array of `[fiberID, duration]` pairs in the exports we hold, but the
 * profiler has serialized it as a plain object in other versions. Both are counted rather
 * than assuming, because guessing wrong here yields a plausible number rather than an error.
 *
 * @internal
 */
function countFibers(value: unknown): number {
  if (Array.isArray(value)) return value.length;
  if (value !== null && typeof value === "object") return Object.keys(value).length;
  return 0;
}

/**
 * Reduces one export to per-commit durations and fiber counts.
 *
 * @throws When the export is not the supported schema version, or carries no root — a tool
 * that silently returned zeros would make the check it feeds pass for the wrong reason.
 */
export function summarizeCapture(raw: unknown, label: string): CaptureSummary {
  const capture = raw as RawCapture;

  if (capture.version !== SUPPORTED_PROFILER_VERSION) {
    throw new Error(
      `${label}: expected profiler export version ${SUPPORTED_PROFILER_VERSION}, got ${String(capture.version)}`,
    );
  }

  const root = capture.dataForRoots?.[0];
  if (root === undefined) throw new Error(`${label}: export carries no root`);

  const commits = root.commitData ?? [];
  if (commits.length === 0) throw new Error(`${label}: export carries no commits`);

  const perCommit = commits.map((commit, index) => ({
    index,
    frame: index + 1,
    durationMs: commit.duration ?? 0,
    fibers: countFibers(commit.fiberActualDurations),
  }));

  return {
    label,
    commits: perCommit.length,
    totalMs: perCommit.reduce((sum, c) => sum + c.durationMs, 0),
    perCommit,
  };
}

/**
 * Totals a contiguous run of commits, named by the frame numbers the documentation uses.
 *
 * @param fromFrame - First frame, inclusive, counting from one.
 * @param toFrame - Last frame, inclusive.
 */
export function summarizeWindow(
  capture: CaptureSummary,
  fromFrame: number,
  toFrame: number,
): WindowSummary {
  const selected = capture.perCommit.filter((c) => c.frame >= fromFrame && c.frame <= toFrame);
  if (selected.length === 0) {
    throw new Error(`${capture.label}: no commits in frames ${fromFrame}-${toFrame}`);
  }

  const totalMs = selected.reduce((sum, c) => sum + c.durationMs, 0);
  const fiberCounts = new Set(selected.map((c) => c.fibers));

  return {
    fromFrame,
    toFrame,
    commits: selected.length,
    totalMs,
    meanMs: totalMs / selected.length,
    fibers: fiberCounts.size === 1 ? [...fiberCounts][0]! : null,
  };
}

/** Both sessions and the window the documentation quotes. */
export function compare(
  yoltraRaw: unknown,
  rtkRaw: unknown,
  window: { fromFrame: number; toFrame: number },
): Comparison {
  const yoltra = summarizeCapture(yoltraRaw, "yoltra");
  const rtk = summarizeCapture(rtkRaw, "rtk");

  return {
    yoltra,
    rtk,
    window: {
      fromFrame: window.fromFrame,
      toFrame: window.toFrame,
      yoltra: summarizeWindow(yoltra, window.fromFrame, window.toFrame),
      rtk: summarizeWindow(rtk, window.fromFrame, window.toFrame),
    },
  };
}

/** Rounds to `places`, so a comparison against published prose is exact rather than close. */
export function round(value: number, places: number): number {
  const factor = 10 ** places;
  return Math.round(value * factor) / factor;
}

/** Renders the table the documentation publishes, from the numbers just computed. */
export function renderTable(report: Comparison): string {
  const { yoltra, rtk, window } = report;
  const ratio = (a: number, b: number): string => `**${round(b / a, 1).toFixed(1)}\u00d7**`;
  const ms = (value: number, places: number): string => `**${round(value, places).toFixed(places)} ms**`;

  const rows = [
    ["", "Yoltra", "Redux Toolkit", "Ratio"],
    ["---", "---", "---", "---"],
    [
      `Whole session (${yoltra.commits} commits)`,
      ms(yoltra.totalMs, 1),
      ms(rtk.totalMs, 1),
      ratio(yoltra.totalMs, rtk.totalMs),
    ],
    [
      `The ${window.yoltra.commits} toggle commits (frames ${String(window.fromFrame).padStart(2, "0")}\u2013${window.toFrame})`,
      ms(window.yoltra.totalMs, 1),
      ms(window.rtk.totalMs, 1),
      ratio(window.yoltra.totalMs, window.rtk.totalMs),
    ],
    [
      "Average per toggle commit",
      ms(window.yoltra.meanMs, 2),
      ms(window.rtk.meanMs, 2),
      ratio(window.yoltra.meanMs, window.rtk.meanMs),
    ],
    [
      "Fibers rendered per toggle commit",
      `**${window.yoltra.fibers ?? "varies"}**`,
      `**${window.rtk.fibers ?? "varies"}**`,
      window.yoltra.fibers !== null && window.rtk.fibers !== null
        ? ratio(window.yoltra.fibers, window.rtk.fibers)
        : "**n/a**",
    ],
  ];

  return rows.map((cells) => `| ${cells.join(" | ")} |`).join("\n");
}

/** The figures a published table claims, extracted so they can be compared with computed ones. */
export interface PublishedFigures {
  readonly sessionMs: { yoltra: number; rtk: number };
  readonly windowMs: { yoltra: number; rtk: number };
  readonly meanMs: { yoltra: number; rtk: number };
  readonly fibers: { yoltra: number; rtk: number };
}

/**
 * Pulls the published figures out of the comparison document.
 *
 * @remarks
 * Deliberately keyed on the row labels rather than on line numbers: the document is edited
 * for prose far more often than for data, and a checker that broke on every reflow would be
 * turned off.
 *
 * @throws When a row is missing or unparseable, which means the document changed shape and
 * the check can no longer speak to it.
 */
export function parsePublishedFigures(markdown: string): PublishedFigures {
  const row = (label: RegExp): number[] => {
    const line = markdown.split("\n").find((l) => label.test(l));
    if (line === undefined) throw new Error(`no row matching ${String(label)} in the document`);
    const numbers = [...line.matchAll(/\*\*([\d.]+)/g)].map((m) => Number(m[1]));
    if (numbers.length < 2) throw new Error(`row ${String(label)} carries no figures`);
    return numbers;
  };

  const session = row(/^\|\s*Whole session/);
  const windowRow = row(/toggle commits \(frames/);
  const mean = row(/^\|\s*Average per toggle commit/);
  const fibers = row(/^\|\s*Fibers rendered per toggle commit/);

  return {
    sessionMs: { yoltra: session[0]!, rtk: session[1]! },
    windowMs: { yoltra: windowRow[0]!, rtk: windowRow[1]! },
    meanMs: { yoltra: mean[0]!, rtk: mean[1]! },
    fibers: { yoltra: fibers[0]!, rtk: fibers[1]! },
  };
}
