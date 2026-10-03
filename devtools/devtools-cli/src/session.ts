/**
 * What the CLI hands to its embedded hub and to its own panel.
 *
 * @remarks
 * Kept out of the entry point so the token's path is testable: `index.ts` starts a hub and
 * renders until the process exits.
 *
 * @module @yoltra/devtools-cli
 */

import type { DevtoolsHubOptions } from "@yoltra/devtools-server";
import type { HubConnectionConfig } from "@yoltra/devtools-ui";
import type { CliArgs } from "./args";

/**
 * Options for the embedded hub.
 *
 * @internal
 */
export function hubOptions(args: CliArgs): DevtoolsHubOptions {
  return {
    port: args.port,
    historySize: args.historySize,
    ...(args.token !== undefined ? { authToken: args.token } : {}),
  };
}

/**
 * Connection config for the terminal panel. It carries the same token as the hub, so the panel
 * is admitted by the hub the CLI started and by one already running with that token.
 *
 * @internal
 */
export function panelConfig(
  args: CliArgs,
  WebSocket: NonNullable<HubConnectionConfig["WebSocket"]>,
): HubConnectionConfig {
  return {
    host: "localhost",
    port: args.port,
    extensionName: "CLI DevTools",
    autoReconnect: true,
    WebSocket,
    ...(args.token !== undefined ? { authToken: args.token } : {}),
  };
}
