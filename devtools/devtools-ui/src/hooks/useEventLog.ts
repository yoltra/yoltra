/**
 * Hook that accumulates a chronological log of store events for inspection.
 *
 * @remarks
 * Subscribes to `STORE_EVENT` messages for a specific store and builds a
 * bounded, time-ordered array of {@link EventLogEntry} objects. The log can
 * be cleared programmatically and resets automatically when the target
 * `storeId` changes.
 *
 * @module @yoltra/devtools-ui
 */

import type { DevtoolsMessage } from "@yoltra/devtools-protocol";
import { useCallback, useEffect, useRef, useState } from "react";
import type { EventLogEntry } from "../types";
import { useHubConnection } from "./useHubConnection";

/** @internal Default upper bound on retained event log entries. */
const DEFAULT_MAX_ENTRIES = 2000;

/**
 * Options for the {@link useEventLog} hook.
 *
 * @public
 */
export interface UseEventLogOptions {
  /** Maximum number of entries to keep. @defaultValue `2000` */
  maxEntries?: number;
}

/**
 * Maintains a chronological event log for a given store.
 *
 * @remarks
 * Events are appended in arrival order. When the log exceeds `maxEntries`
 * the oldest entries are discarded. Passing `null` as `storeId` pauses
 * collection and clears existing entries.
 *
 * @example
 * ```tsx
 * import { useEventLog } from "@yoltra/devtools-ui";
 *
 * function EventTimeline({ storeId }: { storeId: string }) {
 *   const { entries, clear } = useEventLog(storeId, { maxEntries: 500 });
 *   return (
 *     <div>
 *       <button onClick={clear}>Clear</button>
 *       <ul>
 *         {entries.map((e, i) => (
 *           <li key={i}>{e.event.type} @ {e.timestamp}</li>
 *         ))}
 *       </ul>
 *     </div>
 *   );
 * }
 * ```
 *
 * @param storeId - The store ID to track events for, or `null` to disable.
 * @param options - Optional configuration (see {@link UseEventLogOptions}).
 * @returns An object containing the `entries` array and a `clear` function.
 *
 * @public
 */
export function useEventLog(
  storeId: string | null,
  options?: UseEventLogOptions,
): { entries: EventLogEntry[]; clear: () => void } {
  const { subscribe } = useHubConnection();
  const maxEntries = options?.maxEntries ?? DEFAULT_MAX_ENTRIES;
  const [entries, setEntries] = useState<EventLogEntry[]>([]);
  const maxRef = useRef(maxEntries);
  maxRef.current = maxEntries;

  useEffect(() => {
    if (!storeId) return;

    const unsub = subscribe((msg: DevtoolsMessage) => {
      if (msg.type !== "STORE_EVENT") return;
      if (msg.storeId !== storeId) return;

      const entry: EventLogEntry = {
        event: msg.event,
        storeId: msg.storeId,
        patches: msg.patches,
        snapshotVersion: msg.snapshotVersion,
        committed: msg.committed,
        timestamp: msg.timestamp,
      };

      setEntries((prev) => {
        const next = [...prev, entry];
        if (next.length > maxRef.current) {
          return next.slice(next.length - maxRef.current);
        }
        return next;
      });
    });

    return unsub;
  }, [storeId, subscribe]);

  // Clear when storeId changes
  useEffect(() => {
    setEntries([]);
  }, [storeId]);

  const clear = useCallback(() => setEntries([]), []);

  return { entries, clear };
}
