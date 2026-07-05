/**
 * Hook that accumulates a chronological log of store events for inspection.
 *
 * @remarks
 * Subscribes to `STORE_EVENT` messages for **all** stores and stores them in
 * a per-store map so that history is retained when the user switches between
 * store tabs. The `storeId` parameter controls which store's slice is
 * returned, but collection is never paused or reset when the selected store
 * changes.
 *
 * @module @yoltra/devtools-ui
 */

import type { DevtoolsMessage } from "@yoltra/devtools-protocol";
import { useCallback, useEffect, useRef, useState } from "react";
import type { EventLogEntry } from "../types";
import { useHubConnection } from "./useHubConnection";

/** @internal Default upper bound on retained event log entries per store. */
const DEFAULT_MAX_ENTRIES = 2000;

/**
 * Options for the {@link useEventLog} hook.
 *
 * @public
 */
export interface UseEventLogOptions {
  /** Maximum number of entries to keep per store. @defaultValue `2000` */
  maxEntries?: number;
}

/**
 * Maintains a chronological event log for a given store.
 *
 * @remarks
 * Events are accumulated for **all** stores simultaneously in a `Map` keyed
 * by store ID, so switching between store tabs does not discard existing
 * history. Passing `null` as `storeId` returns an empty array but collection
 * continues in the background.
 *
 * When the log for a given store exceeds `maxEntries` the oldest entries for
 * that store are discarded.
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
 * @param storeId - The store ID whose events to return, or `null` to get an
 *   empty slice (collection still runs for all stores).
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

  /**
   * Per-store event log, keyed by storeId.
   * Stored in a ref so mutations don't trigger unnecessary re-renders; we
   * control re-renders manually via the `tick` counter below.
   */
  const allEntriesRef = useRef<Map<string, EventLogEntry[]>>(new Map());
  const maxRef = useRef(maxEntries);
  maxRef.current = maxEntries;

  /**
   * Incremented on every mutation to trigger a re-render so consumers see
   * the latest entries. The value itself is not used in the render output.
   */
  const [, setTick] = useState(0);

  useEffect(() => {
    // Subscribe once for the lifetime of the provider — collect events for
    // ALL stores so history persists regardless of which store tab is active.
    const unsub = subscribe((msg: DevtoolsMessage) => {
      if (msg.type !== "STORE_EVENT") return;

      const sid = msg.storeId;
      const entry: EventLogEntry = {
        event: msg.event,
        storeId: sid,
        patches: msg.patches,
        snapshotVersion: msg.snapshotVersion,
        committed: msg.committed,
        timestamp: msg.timestamp,
      };

      const prev = allEntriesRef.current.get(sid) ?? [];
      const next = [...prev, entry];
      allEntriesRef.current.set(
        sid,
        next.length > maxRef.current ? next.slice(next.length - maxRef.current) : next,
      );

      setTick((t) => t + 1);
    });

    return unsub;
    // subscribe is stable for the lifetime of HubProvider — intentionally
    // omit storeId so the subscription is never restarted on tab switch.
  }, [subscribe]);

  /** Clear the event log for the currently selected store only. */
  const clear = useCallback(() => {
    if (storeId) {
      allEntriesRef.current.delete(storeId);
      setTick((t) => t + 1);
    }
  }, [storeId]);

  const entries = storeId ? (allEntriesRef.current.get(storeId) ?? []) : [];

  return { entries, clear };
}
