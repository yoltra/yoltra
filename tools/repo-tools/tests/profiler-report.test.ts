import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import {
  compare,
  parsePublishedFigures,
  round,
  summarizeCapture,
  summarizeWindow,
} from "../src/profiler-report";

/**
 * The comparison in `redux-yoltra-profiler.md` is the strongest evidence in this repository
 * for the claim the library is built on, and its figures were transcribed by hand from two
 * profiler exports captured in one sitting. This asserts the prose still matches the data.
 *
 * Edit the table without recomputing and this fails. Replace the captures and it fails until
 * the document is regenerated. That is the whole point: the numbers stop being a claim and
 * become a result.
 */

const REPO = path.resolve(__dirname, "..", "..", "..");
const EXAMPLE = path.join(REPO, "examples", "v0", "yoltra-in-react");
const PROFILER = path.join(EXAMPLE, "public", "assets", "profiler");

/** Frames 08-19; the first seven are startup and near-identical between the two. */
const WINDOW = { fromFrame: 8, toFrame: 19 };

function capture(kind: "yoltra" | "rtk"): unknown {
  const dir = path.join(PROFILER, kind);
  const file = readdirSync(dir).find(
    (f) => f.startsWith("profiling-data.") && f.endsWith(".json"),
  );
  if (file === undefined) throw new Error(`no profiling export in ${dir}`);
  return JSON.parse(readFileSync(path.join(dir, file), "utf8"));
}

const report = compare(capture("yoltra"), capture("rtk"), WINDOW);
const published = parsePublishedFigures(
  readFileSync(path.join(EXAMPLE, "redux-yoltra-profiler.md"), "utf8"),
);

describe("the published profiler figures match the captures", () => {
  it("agrees on the whole session", () => {
    expect(round(report.yoltra.totalMs, 1)).toBe(published.sessionMs.yoltra);
    expect(round(report.rtk.totalMs, 1)).toBe(published.sessionMs.rtk);
  });

  it("agrees on the toggle commits", () => {
    expect(round(report.window.yoltra.totalMs, 1)).toBe(published.windowMs.yoltra);
    expect(round(report.window.rtk.totalMs, 1)).toBe(published.windowMs.rtk);
  });

  it("agrees on the average per toggle commit", () => {
    expect(round(report.window.yoltra.meanMs, 2)).toBe(published.meanMs.yoltra);
    expect(round(report.window.rtk.meanMs, 2)).toBe(published.meanMs.rtk);
  });

  it("agrees on fibers rendered per toggle commit", () => {
    // A single number may only be quoted while every commit in the window agrees on it.
    expect(report.window.yoltra.fibers).toBe(published.fibers.yoltra);
    expect(report.window.rtk.fibers).toBe(published.fibers.rtk);
  });

  it("agrees with the generated summary beside it", () => {
    // The summary is what the example's page reads. Pinning it here means the captures, the
    // machine-readable artefact and the prose cannot drift apart from one another.
    const summary = JSON.parse(
      readFileSync(path.join(EXAMPLE, "profiler-summary.json"), "utf8"),
    ) as {
      session: { yoltraMs: number; rtkMs: number };
      toggleCommits: { yoltraMs: number; rtkMs: number; yoltraFibers: number; rtkFibers: number };
    };

    expect(summary.session.yoltraMs).toBe(published.sessionMs.yoltra);
    expect(summary.session.rtkMs).toBe(published.sessionMs.rtk);
    expect(summary.toggleCommits.yoltraMs).toBe(published.windowMs.yoltra);
    expect(summary.toggleCommits.rtkMs).toBe(published.windowMs.rtk);
    expect(summary.toggleCommits.yoltraFibers).toBe(published.fibers.yoltra);
    expect(summary.toggleCommits.rtkFibers).toBe(published.fibers.rtk);
  });

  it("compares two sessions of the same shape", () => {
    // A ratio between sessions of different lengths would be meaningless.
    expect(report.yoltra.commits).toBe(report.rtk.commits);
    expect(report.window.yoltra.commits).toBe(report.window.rtk.commits);
  });
});

describe("the parser refuses what it cannot speak to", () => {
  it("rejects an unsupported export version", () => {
    expect(() => summarizeCapture({ version: 4, dataForRoots: [] }, "x")).toThrow(
      /version 5, got 4/,
    );
  });

  it("rejects an export with no root", () => {
    expect(() => summarizeCapture({ version: 5, dataForRoots: [] }, "x")).toThrow(/no root/);
  });

  it("rejects an export with no commits", () => {
    expect(() =>
      summarizeCapture({ version: 5, dataForRoots: [{ commitData: [] }] }, "x"),
    ).toThrow(/no commits/);
  });

  it("reports varying fiber counts as no single number", () => {
    const varied = summarizeCapture(
      {
        version: 5,
        dataForRoots: [
          {
            commitData: [
              { duration: 1, fiberActualDurations: [[1, 1]] },
              { duration: 1, fiberActualDurations: [[1, 1], [2, 1]] },
            ],
          },
        ],
      },
      "x",
    );

    expect(summarizeWindow(varied, 1, 2).fibers).toBeNull();
  });

  it("counts fibers whether the profiler serialized pairs or an object", () => {
    const asObject = summarizeCapture(
      {
        version: 5,
        dataForRoots: [{ commitData: [{ duration: 1, fiberActualDurations: { "1": 1, "2": 1 } }] }],
      },
      "x",
    );

    expect(asObject.perCommit[0]!.fibers).toBe(2);
  });

  it("refuses a document whose table it cannot find", () => {
    expect(() => parsePublishedFigures("# nothing here")).toThrow(/no row matching/);
  });
});
