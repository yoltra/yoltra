/**
 * @module @yoltra/devtools-storeview
 */

import cx from "classnames";
import styles from "./ConnectionDot.module.css";

/**
 * Colored dot indicating connection status.
 *
 * Renders a small circular indicator whose color maps to the current
 * connection state: green for connected, amber for connecting, and red for
 * disconnected. Unknown states fall back to a muted grey.
 *
 * @param props.status - The connection status string (`"connected"`, `"connecting"`, or `"disconnected"`).
 * @public
 */
export function ConnectionDot({ status }: { status: string }) {
  return <span className={cx(styles.dot, styles[status])} aria-label={status} />;
}
