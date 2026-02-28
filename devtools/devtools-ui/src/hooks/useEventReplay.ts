/**
 * Hook that replays a sequence of events through a store's reducer pipeline
 * starting from a given snapshot.
 *
 * @remarks
 * Sends an `EVENT_REPLAY` message to the hub containing the base snapshot
 * and the ordered list of events to replay. The store re-processes each
 * event through its reducers and updates its state accordingly. This is
 * useful for "what-if" analysis and debugging reducer logic.
 *
 * @module @yoltra/devtools-ui
 */

import { DevtoolsRole } from "@yoltra/devtools-protocol";
import { useCallback } from "react";
import type { EventLogEntry } from "../types";
import { useHubConnection } from "./useHubConnection";

/**
 * Replays events through a store's reducers from a given snapshot.
 *
 * @remarks
 * The `replay` function accepts a base state snapshot and an array of
 * {@link EventLogEntry} objects. It serialises the events into the protocol
 * format and sends a single `EVENT_REPLAY` message to the hub. The store
 * is expected to process each event sequentially through its reducer
 * pipeline and emit the resulting state.
 *
 * @example
 * ```tsx
 * import { useEventLog, useStoreState, useEventReplay } from "@yoltra/devtools-ui";
 *
 * function ReplayButton({ storeId }: { storeId: string }) {
 *   const { state } = useStoreState(storeId);
 *   const { entries } = useEventLog(storeId);
 *   const { replay } = useEventReplay(storeId);
 *
 *   return (
 *     <button onClick={() => replay(state, entries)}>
 *       Replay All Events
 *     </button>
 *   );
 * }
 * ```
 *
 * @param storeId - The store ID to replay events on, or `null` to disable.
 * @returns An object containing the `replay` function.
 *
 * @public
 */
export function useEventReplay(storeId: string | null): {
  replay: (snapshot: unknown, events: EventLogEntry[]) => void;
} {
  const { send } = useHubConnection();

  const replay = useCallback(
    (snapshot: unknown, events: EventLogEntry[]) => {
      if (!storeId) return;

      send({
        type: "EVENT_REPLAY",
        storeId,
        snapshot,
        events: events.map((e) => ({
          id: e.event.id,
          channel: e.event.channel,
          type: e.event.type,
          payload: e.event.payload,
        })),
        timestamp: new Date().toISOString(),
        sourceId: "",
        sourceRole: DevtoolsRole.EXTENSION,
      });
    },
    [storeId, send],
  );

  return { replay };
}
