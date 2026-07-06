import { describe, expect, it } from "vitest";

import { planStep } from "../src/hooks/timeTravelNav";

describe("planStep — back", () => {
  it("from live, starts at the newest event and steps to the one before it", () => {
    expect(planStep("back", { isTimeTraveling: false, currentIndex: -1, entryCount: 5 })).toEqual({
      kind: "jump",
      index: 3,
    });
  });

  it("while traveling, steps one earlier", () => {
    expect(planStep("back", { isTimeTraveling: true, currentIndex: 3, entryCount: 5 })).toEqual({
      kind: "jump",
      index: 2,
    });
  });

  it("does nothing at the very first event", () => {
    expect(planStep("back", { isTimeTraveling: true, currentIndex: 0, entryCount: 5 })).toEqual({
      kind: "none",
    });
  });

  it("does nothing with a single event (nothing earlier to view)", () => {
    expect(planStep("back", { isTimeTraveling: false, currentIndex: -1, entryCount: 1 })).toEqual({
      kind: "none",
    });
  });
});

describe("planStep — forward", () => {
  it("does nothing when not traveling (already live)", () => {
    expect(planStep("forward", { isTimeTraveling: false, currentIndex: -1, entryCount: 5 })).toEqual(
      { kind: "none" },
    );
  });

  it("while traveling, advances one event", () => {
    expect(planStep("forward", { isTimeTraveling: true, currentIndex: 1, entryCount: 5 })).toEqual({
      kind: "jump",
      index: 2,
    });
  });

  it("steps onto the newest event (last index) rather than resuming early", () => {
    // currentIndex 3, last index 4 → step onto 4 (the newest), stay traveling.
    expect(planStep("forward", { isTimeTraveling: true, currentIndex: 3, entryCount: 5 })).toEqual({
      kind: "jump",
      index: 4,
    });
  });

  it("resumes live only when stepping past the last index", () => {
    expect(planStep("forward", { isTimeTraveling: true, currentIndex: 4, entryCount: 5 })).toEqual({
      kind: "resume",
    });
  });
});
