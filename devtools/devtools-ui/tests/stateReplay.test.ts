import { describe, expect, it } from "vitest";

import { replayState, type ReplayableEntry } from "../src/hooks/stateReplay";

/**
 * Rebuilding state from a baseline, without redoing the whole history each time.
 *
 * The panel replays patches forward from the first snapshot. Doing that from the beginning on
 * every call meant the cost of watching a store grew with the length of its history — and live
 * events arrive while the panel is open, so each one triggered another full replay through every
 * entry before it.
 */

const baseline = { state: { n: 0 }, version: 0 };

/** An entry that sets `/n` to `value`. */
function entry(value: number, snapshotVersion = value): ReplayableEntry {
  return { snapshotVersion, patches: [{ op: "replace", path: "/n", value }] };
}

describe("replayState", () => {
  it("returns the baseline when nothing has happened", () => {
    const { state } = replayState({ baseline, entries: [], index: -1, cache: null });
    expect(state).toEqual({ n: 0 });
  });

  it("replays forward to the requested position", () => {
    const entries = [entry(1), entry(2), entry(3)];
    const { state } = replayState({ baseline, entries, index: 2, cache: null });
    expect(state).toEqual({ n: 3 });
  });

  it("continues from the cache instead of starting over", () => {
    const entries = [entry(1), entry(2)];
    const first = replayState({ baseline, entries, index: 0, cache: null });

    // A patch that would be wrong to apply twice, to prove the earlier entries were not
    // replayed again on top of the cached result.
    const grow: ReplayableEntry = {
      snapshotVersion: 2,
      patches: [{ op: "add", path: "/list/-", value: "x" }],
    };
    const withList: ReplayableEntry[] = [
      { snapshotVersion: 1, patches: [{ op: "replace", path: "/list", value: [] as string[] }] },
      grow,
    ];
    const seeded = replayState({ baseline, entries: withList, index: 0, cache: null });
    const next = replayState({ baseline, entries: withList, index: 1, cache: seeded.cache });

    expect((next.state as { list: string[] }).list).toEqual(["x"]);
    expect((first.state as { n: number }).n).toBe(1);
  });

  it("gives the same answer with a cache as without one", () => {
    const entries = [entry(1), entry(2), entry(3), entry(4)];

    let cache = null as ReturnType<typeof replayState>["cache"];
    for (let i = 0; i <= 3; i++) cache = replayState({ baseline, entries, index: i, cache }).cache;

    const incremental = replayState({ baseline, entries, index: 3, cache });
    const fromScratch = replayState({ baseline, entries, index: 3, cache: null });

    expect(incremental.state).toEqual(fromScratch.state);
  });

  it("starts over rather than trusting a cache the log has shifted under", () => {
    const entries = [entry(1), entry(2), entry(3)];
    const cached = replayState({ baseline, entries, index: 2, cache: null }).cache;

    // The event log is capped and drops its oldest entries, so every index moves left. A cache
    // keyed on position alone would resume from an entry that is no longer the one it recorded
    // and hand back a state the store never had.
    const trimmed = entries.slice(1);
    const { state } = replayState({ baseline, entries: trimmed, index: 1, cache: cached });

    expect(state).toEqual({ n: 3 });
  });

  it("starts over when scrubbing backwards", () => {
    const entries = [entry(1), entry(2), entry(3)];
    const cached = replayState({ baseline, entries, index: 2, cache: null }).cache;

    // Patches describe a change, not its inverse, so there is nothing to step back through.
    const { state } = replayState({ baseline, entries, index: 0, cache: cached });

    expect(state).toEqual({ n: 1 });
  });

  it("skips entries the baseline already reflects", () => {
    const entries = [entry(1, 1), entry(2, 2)];
    const later = { state: { n: 1 }, version: 1 };

    const { state } = replayState({ baseline: later, entries, index: 1, cache: null });

    expect(state).toEqual({ n: 2 });
  });

  it("reports nothing before a baseline exists", () => {
    const { state, cache } = replayState({
      baseline: null,
      entries: [entry(1)],
      index: 0,
      cache: null,
    });
    expect(state).toBeNull();
    expect(cache).toBeNull();
  });
});
