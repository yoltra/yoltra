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

import { DevtoolsRole } from "@yoltra/devtools-protocol";
import { useCallback, useState } from "react";
import type { EventLogEntry } from "../types";
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
): {
  currentIndex: number;
  isTimeTraveling: boolean;
  jumpTo: (index: number) => void;
  stepBack: () => void;
  stepForward: () => void;
  resume: () => void;
} {
  const { send } = useHubConnection();
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [isTimeTraveling, setIsTimeTraveling] = useState(false);

  const jumpTo = useCallback(
    (index: number) => {
      if (!storeId || index < 0 || index >= entries.length) return;

      setCurrentIndex(index);
      setIsTimeTraveling(true);

      // We need to reconstruct state at this index.
      // Send TIME_TRAVEL with the state. The extension needs to have
      // computed this state from initial snapshot + patches.
      // For v1, we send the snapshot version and let the store handle it.
      const entry = entries[index];
      send({
        type: "TIME_TRAVEL",
        storeId,
        state: null, // State must be provided by the view layer that has it
        snapshotVersion: entry.snapshotVersion,
        timestamp: new Date().toISOString(),
        sourceId: "",
        sourceRole: DevtoolsRole.EXTENSION,
      });
    },
    [storeId, entries, send],
  );

  const stepBack = useCallback(() => {
    const target = isTimeTraveling ? currentIndex - 1 : entries.length - 2;
    if (target >= 0) jumpTo(target);
  }, [isTimeTraveling, currentIndex, entries.length, jumpTo]);

  const stepForward = useCallback(() => {
    if (!isTimeTraveling) return;
    if (currentIndex < entries.length - 1) {
      jumpTo(currentIndex + 1);
    } else {
      // Reached the end — resume live
      setIsTimeTraveling(false);
      setCurrentIndex(-1);
    }
  }, [isTimeTraveling, currentIndex, entries.length, jumpTo]);

  const resume = useCallback(() => {
    setIsTimeTraveling(false);
    setCurrentIndex(-1);
    // Jump to latest state — send the latest entry's version
    if (storeId && entries.length > 0) {
      const latest = entries[entries.length - 1];
      send({
        type: "TIME_TRAVEL",
        storeId,
        state: null,
        snapshotVersion: latest.snapshotVersion,
        timestamp: new Date().toISOString(),
        sourceId: "",
        sourceRole: DevtoolsRole.EXTENSION,
      });
    }
  }, [storeId, entries, send]);

  return {
    currentIndex,
    isTimeTraveling,
    jumpTo,
    stepBack,
    stepForward,
    resume,
  };
}
