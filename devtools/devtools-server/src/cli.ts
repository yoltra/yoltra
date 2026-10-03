/**
 * CLI entry-point for the standalone DevTools hub process.
 *
 * @module @yoltra/devtools-server
 */

import { DevtoolsHub } from "./hub";

/**
 * Parse CLI arguments and start the hub server.
 *
 * @remarks
 * Supported flags:
 *
 * | Flag               | Default | Description                        |
 * | ------------------ | ------- | ---------------------------------- |
 * | `--port`           | `9800`  | WebSocket port to bind on.         |
 * | `--history-size`   | `1000`  | Ring-buffer capacity for replays.  |
 * | `--token`          | none    | Shared secret every client must present (the hub's `authToken` option). |
 *
 * The token can also come from the `YOLTRA_DEVTOOLS_TOKEN` environment variable, which keeps it
 * out of the process list; `--token` wins when both are set. Without either, the hub runs open
 * and says so at startup.
 *
 * The function stops the hub cleanly when the CLI is interrupted, and exits
 * with code `1` if the server fails to start.
 *
 * Usage: `npx @yoltra/devtools-server [--port 9800] [--history-size 1000] [--token <secret>]`
 *
 * @param argv - Argument vector to parse. Defaults to `process.argv`.
 * @returns Resolves once the hub is listening; never resolves during
 *          normal operation (the hub runs until the CLI is interrupted).
 *
 * @public
 */
export async function main(argv: string[] = process.argv): Promise<void> {
  const portIdx = argv.indexOf("--port");
  const port = parseInt(
    argv.find((a) => a.startsWith("--port="))?.split("=")[1] ??
      (portIdx !== -1 ? argv[portIdx + 1] : undefined) ??
      "9800",
  );

  const histIdx = argv.indexOf("--history-size");
  const historySize = parseInt(
    argv.find((a) => a.startsWith("--history-size="))?.split("=")[1] ??
      (histIdx !== -1 ? argv[histIdx + 1] : undefined) ??
      "1000",
  );

  // A flag given without a value is refused rather than read as "no token": falling back to an
  // open hub is the one outcome someone typing `--token` did not ask for.
  const tokenIdx = argv.indexOf("--token");
  const tokenFlag =
    argv.find((a) => a.startsWith("--token="))?.slice("--token=".length) ??
    (tokenIdx !== -1 ? (argv[tokenIdx + 1] ?? "") : undefined);
  if (tokenFlag !== undefined && (tokenFlag === "" || tokenFlag.startsWith("--"))) {
    console.error("--token needs a value, for example `--token <secret>`.");
    process.exit(2);
    return;
  }
  const authToken = tokenFlag ?? (process.env.YOLTRA_DEVTOOLS_TOKEN || undefined);

  const hub = new DevtoolsHub({ port, historySize, ...(authToken ? { authToken } : {}) });

  // Clean stop on interrupt
  const shutdown = async () => {
    console.log("\nShutting down DevTools hub...");
    await hub.stop();
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);

  try {
    await hub.start();
    console.log(`Yoltra DevTools hub running on ws://127.0.0.1:${port}`);
    console.log(`History buffer: ${historySize} events`);
    if (authToken) console.log("Clients must present the auth token");
  } catch (err) {
    console.error("Failed to start DevTools hub:", err);
    process.exit(1);
  }
}
