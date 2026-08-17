/**
 * @module @yoltra/devtools-storeview
 */

import cx from "classnames";
import styles from "./ConnectionDot.module.css";

/**
 * Props for {@link ConnectionDot}.
 *
 * @public
 */
export interface ConnectionDotProps {
  /** The connection status string (`"connected"`, `"connecting"`, or `"disconnected"`). */
 status: string
}

/**
 * Colored dot indicating connection status.
 *
 * Renders a small circular indicator whose color maps to the current
 * connection state: green for connected, amber for connecting, and red for
 * disconnected. Unknown states fall back to a muted grey.
 *
 * @public
 */
export function ConnectionDot({ status }: ConnectionDotProps) {
  return <span className={cx(styles.dot, styles[status])} aria-label={status} />;
}
