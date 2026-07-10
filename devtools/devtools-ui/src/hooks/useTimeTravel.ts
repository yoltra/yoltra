/**
 * Hook that enables time-travel debugging by navigating through an event log
 * and sending `TIME_TRAVEL` commands to a Yoltra store.
 *
 * @remarks
 * Works in concert with {@link useEventLog} -- pass its `entries` array to
 * this hook. Jumping to a specific index sends a `TIME_TRAVEL` message with
 * the corresponding snapshot version so the store can restore that point in
 * time. Call `resume()` to return to live state.
 *
 * @module @yoltra/devtools-ui
 */

import { DevtoolsRole, type DevtoolsMessage } from "@yoltra/devtools-protocol";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { EventLogEntry } from "../types";
import { applyPatches } from "../utils/apply-patch";
import { planStep } from "./timeTravelNav";
import { useHubConnection } from "./useHubConnection";

/**
 * Provides time-travel navigation through the event log.
 *
 * @remarks
 * The hook tracks whether the user is actively time-traveling via
 * `isTimeTraveling`. While traveling, `currentIndex` indicates the position
 * within the `entries` array. The `stepBack` / `stepForward` helpers move
 * one entry at a time, while `jumpTo` allows arbitrary positioning. Calling
 * `resume()` exits time-travel mode, jumps to the latest entry, and resets
 * the index to `-1`.
 *
 * @example
 * ```tsx
 * import { useEventLog, useTimeTravel } from "@yoltra/devtools-ui";
 *
 * function TimeTravelControls({ storeId }: { storeId: string }) {
 *   const { entries } = useEventLog(storeId);
 *   const { currentIndex, isTimeTraveling, stepBack, stepForward, resume } =
 *     useTimeTravel(storeId, entries);
 *
 *   return (
 *     <div>
 *       <button onClick={stepBack} disabled={currentIndex <= 0}>Back</button>
 *       <button onClick={stepForward}>Forward</button>
 *       {isTimeTraveling && <button onClick={resume}>Resume Live</button>}
 *       <span>Index: {currentIndex} / {entries.length - 1}</span>
 *     </div>
 *   );
 * }
 * ```
 *
 * @param storeId - The store ID to time-travel, or `null` to disable.
 * @param entries - The event log entries (typically from {@link useEventLog}).
 * @returns An object with `currentIndex`, `isTimeTraveling`, `jumpTo`,
 *   `stepBack`, `stepForward`, and `resume`.
 *
 * @public
 */
export function useTimeTravel(
  storeId: string | null,
  entries: EventLogEntry[],
  /**
   * Whether the selected store advertised the `replay` capability. Time-travel
   * commands are gated on it (DEV-4): the agent/core enforce it too, but the UI
   * should not send commands that will be dropped. Defaults to `true`.
   */
  canReplay: boolean = true,
): {
  currentIndex: number;
  isTimeTraveling: boolean;
  /**
   * The store state reconstructed at the currently-viewed position (the
   * scrubbed index while traveling, otherwise the latest entry). `null` until
   * the baseline snapshot has been captured. Lets consumers render a live
   * preview of the state at any point in history.
   */
  previewState: unknown;
  /**
   * The event count the timeline is measured against: frozen at travel-start
   * so a live-emitting store cannot shift the scrubber, or `null` when live
   * (use `entries.length`). Consumers should size the slider/label off
   * `frameCount ?? entries.length`.
   */
  frameCount: number | null;
  jumpTo: (index: number) => void;
  stepBack: () => void;
  stepForward: () => void;
  resume: () => void;
} {
  const { send, subscribe } = useHubConnection();
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [isTimeTraveling, setIsTimeTraveling] = useState(false);

  // The event count frozen at the moment a travel session begins. While
  // traveling, the timeline (slider range, position label, forward boundary)
  // is measured against this frame instead of the live `entries.length`, so a
  // store that keeps emitting does not shift the scrubber under the user —
  // otherwise a fixed position appears to drift backward as the log grows.
  // `null` when live.
  const [frameCount, setFrameCount] = useState<number | null>(null);

  // The first STATE_SNAPSHOT received for this store, used as the baseline
  // for forward-replay state reconstruction. Only the first snapshot is
  // captured (the connect-time snapshot); time-travel response snapshots
  // sent back by the store are intentionally ignored so they don't overwrite
  // the baseline and corrupt future reconstructions.
  const baselineRef = useRef<{ state: unknown; version: number } | null>(null);

  useEffect(() => {
    // Reset baseline whenever the target store changes so a fresh snapshot
    // is captured for the new store.
    baselineRef.current = null;
    setFrameCount(null);
    if (!storeId) return;

    return subscribe((msg: DevtoolsMessage) => {
      if (
        msg.type === "STATE_SNAPSHOT" &&
        msg.storeId === storeId &&
        baselineRef.current === null
      ) {
        baselineRef.current = { state: msg.state, version: msg.version };
      }
    });
  }, [storeId, subscribe]);

  // Reconstruct the store state at a specific entries index by applying
  // each entry's patches sequentially from the baseline forward.
  // Returns null when no baseline has been captured yet (devtools still
  // waiting for the first STATE_SNAPSHOT).
  const buildStateAt = useCallback(
    (index: number): unknown => {
      const baseline = baselineRef.current;
      if (!baseline) return null;

      let state = baseline.state;
      for (let i = 0; i <= index; i++) {
        const entry = entries[i];
        if (!entry) break;
        // Skip entries that pre-date our baseline snapshot.
        if (entry.snapshotVersion <= baseline.version) continue;
        state = applyPatches(state as any, entry.patches);
      }
      return state;
    },
    [entries],
  );

  const jumpTo = useCallback(
    (index: number) => {
      // Do not send if the store can't replay (DEV-4) — the command would be a no-op.
      if (!storeId || !canReplay || index < 0 || index >= entries.length) return;

      // Freeze the timeline frame the first time we leave live, so subsequent
      // live events don't grow the slider range under the user.
      setFrameCount((prev) => prev ?? entries.length);
      setCurrentIndex(index);
      setIsTimeTraveling(true);

      const entry = entries[index]!;
      send({
        type: "TIME_TRAVEL",
        storeId,
        state: buildStateAt(index),
        snapshotVersion: entry.snapshotVersion,
        timestamp: new Date().toISOString(),
        sourceId: "",
        sourceRole: DevtoolsRole.EXTENSION,
      });
    },
    [storeId, entries, send, buildStateAt, canReplay],
  );

  const resume = useCallback(() => {
    setIsTimeTraveling(false);
    setCurrentIndex(-1);
    setFrameCount(null);
    // Restore the store to the latest known state by computing the state at
    // the last entry and sending a TIME_TRAVEL to snap it back (DEV-4: only if
    // the store can replay; the local reset above still runs regardless).
    if (canReplay && storeId && entries.length > 0) {
      const latestIndex = entries.length - 1;
      const latest = entries[latestIndex]!;
      send({
        type: "TIME_TRAVEL",
        storeId,
        state: buildStateAt(latestIndex),
        snapshotVersion: latest.snapshotVersion,
        timestamp: new Date().toISOString(),
        sourceId: "",
        sourceRole: DevtoolsRole.EXTENSION,
      });
    }
  }, [storeId, entries, send, buildStateAt, canReplay]);

  // While traveling the timeline is measured against the frozen frame, so
  // steps and boundaries ignore events that arrive mid-session.
  const timelineCount = frameCount ?? entries.length;

  const stepBack = useCallback(() => {
    const action = planStep("back", {
      isTimeTraveling,
      currentIndex,
      entryCount: timelineCount,
    });
    if (action.kind === "jump") jumpTo(action.index);
  }, [isTimeTraveling, currentIndex, timelineCount, jumpTo]);

  const stepForward = useCallback(() => {
    const action = planStep("forward", {
      isTimeTraveling,
      currentIndex,
      entryCount: timelineCount,
    });
    if (action.kind === "jump") jumpTo(action.index);
    else if (action.kind === "resume") resume();
  }, [isTimeTraveling, currentIndex, timelineCount, jumpTo, resume]);

  // The state at the currently-viewed position: the scrubbed index while
  // traveling, otherwise the newest entry. Recomputed from the baseline so the
  // preview follows both the slider and newly-arriving live events.
  const previewState = useMemo(
    () => buildStateAt(isTimeTraveling ? currentIndex : entries.length - 1),
    [buildStateAt, isTimeTraveling, currentIndex, entries.length],
  );

  return {
    currentIndex,
    isTimeTraveling,
    previewState,
    frameCount,
    jumpTo,
    stepBack,
    stepForward,
    resume,
  };
}
