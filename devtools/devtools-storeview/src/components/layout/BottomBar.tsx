/**
 * @module @yoltra/devtools-storeview
 */

import { PROTOCOL_VERSION } from "@yoltra/devtools-protocol";
import type { EventLogEntry, HubConnectionStatus } from "@yoltra/devtools-ui";
import { ConnectionDot } from "../shared/ConnectionDot";
import styles from "./BottomBar.module.css";

/**
 * Props for {@link BottomBar}.
 *
 * @public
 */
export interface BottomBarProps {
  /** The hub connection status. */
  status: HubConnectionStatus;
  /** The event log (for the running count). */
  entries: EventLogEntry[];
  /** Whether a time-travel session is active. */
  isTimeTraveling?: boolean;
}

/**
 * Bottom status line: hub connection, event count, a time-travel indicator,
 * and the protocol version. The time-travel controls themselves live in the
 * Time Travel view; this bar only reflects that a session is active.
 *
 * @public
 */
export function BottomBar({
  status,
  entries,
  isTimeTraveling,
}: BottomBarProps) {
  return (
    <footer className={styles.bottomBar}>
      <span className={styles.item}>
        <ConnectionDot status={status} />
        <span>Hub {status}</span>
      </span>
      {isTimeTraveling && (
        <span className={styles.travelPill}>&#9200; Time-traveling</span>
      )}
      <span className={styles.spacer} />
      <span className={styles.item}>
        {entries.length} event{entries.length === 1 ? "" : "s"}
      </span>
      <span className={styles.item}>Protocol v{PROTOCOL_VERSION}</span>
    </footer>
  );
}
