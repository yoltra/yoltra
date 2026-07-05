/**
 * @module @yoltra/devtools-storeview
 */

import { PROTOCOL_VERSION, type StoreCapabilities } from "@yoltra/devtools-protocol";
import {
  useTimeTravel,
  type EventLogEntry,
  type HubConnectionStatus,
} from "@yoltra/devtools-ui";
import { TimeTravelPanel } from "../panels/TimeTravelPanel";
import { ConnectionDot } from "../shared/ConnectionDot";

/**
 * Bottom bar showing hub connection status, protocol version, and
 * (when the selected store supports it) the time-travel controls.
 *
 * @param props.status - The hub connection status string.
 * @param props.capabilities - Capabilities of the currently selected store,
 *   used to show or hide the time-travel controls.
 * @public
 */
export function BottomBar({
  effectiveStoreId,
  entries,
  status,
  capabilities,
}: {
  effectiveStoreId: string | null;
  entries: EventLogEntry[];
  status: HubConnectionStatus;
  capabilities: StoreCapabilities | null;
}) {
  const { currentIndex, isTimeTraveling, jumpTo, stepBack, stepForward, resume } =
    useTimeTravel(effectiveStoreId, entries, capabilities?.replay ?? false);

  return (
    <footer>
      <div>
        <span>
          <ConnectionDot status={status} />
          Hub: {status}
        </span>
        <span>Protocol v{PROTOCOL_VERSION}</span>
      </div>

      {capabilities?.replay && (
        <TimeTravelPanel
          entries={entries}
          currentIndex={currentIndex}
          isTimeTraveling={isTimeTraveling}
          onJumpTo={jumpTo}
          onStepBack={stepBack}
          onStepForward={stepForward}
          onResume={resume}
        />
      )}
    </footer>
  );
}
