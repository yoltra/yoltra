/**
 * @module @yoltra/devtools-storeview
 */

import cx from "classnames";

/**
 * Colored dot indicating connection status.
 *
 * Renders an 8px circular indicator whose color maps to the current
 * connection state: green for connected, yellow for connecting, and
 * red for disconnected.
 *
 * @param props.status - The connection status string (`"connected"`, `"connecting"`, or `"disconnected"`).
 * @public
 */
export function ConnectionDot({ status }: { status: string }) {
  const className = cx({
    [status]: true,
  });

  return <span className={className} />;
}
