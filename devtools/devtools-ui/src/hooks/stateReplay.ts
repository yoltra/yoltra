/**
 * Forward state reconstruction from a baseline snapshot.
 *
 * @remarks
 * Extracted as a pure function for the same reason the step boundary maths was: it is the part
 * with the interesting failure modes, and inside a hook it can only be exercised through a
 * rendered component.
 *
 * The panel reconstructs state by replaying patches from the first snapshot forward. Doing that
 * from the beginning on every call made the cost of watching a store grow with the length of its
 * history — and live events arrive while the panel is open, each one triggering another full
 * replay. Carrying the previous result forward turns that back into the one entry that actually
 * arrived.
 *
 * @module @yoltra/devtools-ui
 */

import { applyPatches } from "../utils/apply-patch";

/** Minimal shape of an event log entry needed to replay it. */
export interface ReplayableEntry {
  readonly snapshotVersion: number;
  readonly patches: Parameters<typeof applyPatches>[1];
}

/** The baseline a replay starts from. */
export interface ReplayBaseline {
  readonly state: unknown;
  readonly version: number;
}

/**
 * A previous reconstruction, reusable as the starting point for the next.
 *
 * @remarks
 * `marker` is the entry that occupied `index` when this state was built. It is what makes reuse
 * safe: the event log is capped and drops its oldest entries, which shifts every index left, so
 * a cache keyed on position alone would resume from an entry that is no longer the one it
 * recorded and produce a state that never existed.
 */
export interface ReplayCache {
  readonly index: number;
  readonly state: unknown;
  readonly marker: unknown;
}

/** Result of {@link replayState}: the state, and the cache to pass in next time. */
export interface ReplayResult {
  readonly state: unknown;
  readonly cache: ReplayCache | null;
}

/**
 * Rebuilds the state as of `index`, continuing from `cache` when it is still valid.
 *
 * @param args.baseline - First snapshot received, and the version it was taken at.
 * @param args.entries - Event log, oldest first.
 * @param args.index - Position to rebuild to. Negative means "just the baseline".
 * @param args.cache - Result of a previous call, or `null`.
 *
 * @returns The reconstructed state and the cache for the next call.
 *
 * @remarks
 * Only moves forward. Patches describe a change rather than its inverse, so scrubbing backwards
 * starts again from the baseline — a cost bounded by how fast somebody can drag a slider, which
 * is not the case that made the panel unusable.
 *
 * @public
 */
export function replayState(args: {
  baseline: ReplayBaseline | null;
  entries: readonly ReplayableEntry[];
  index: number;
  cache: ReplayCache | null;
}): ReplayResult {
  const { baseline, entries, index, cache } = args;
  if (baseline === null) return { state: null, cache: null };

  let start = 0;
  let state = baseline.state;

  // Reusable only when it points at the same entry it was built against, and only for a
  // position at or after it.
  if (cache !== null && cache.index <= index && entries[cache.index] === cache.marker) {
    start = cache.index + 1;
    state = cache.state;
  }

  for (let i = start; i <= index; i++) {
    const entry = entries[i];
    if (entry === undefined) break;
    // Entries older than the baseline are already reflected in it.
    if (entry.snapshotVersion <= baseline.version) continue;
    state = applyPatches(state, entry.patches);
  }

  const marker = entries[index];
  return {
    state,
    cache: index >= 0 && marker !== undefined ? { index, state, marker } : null,
  };
}
