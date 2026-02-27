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
 *
 * The function installs `SIGINT` and `SIGTERM` handlers for graceful
 * shutdown and exits with code `1` if the server fails to start.
 *
 * Usage: `npx @yoltra/devtools-server [--port 9800] [--history-size 1000]`
 *
 * @param argv - Argument vector to parse. Defaults to `process.argv`.
 * @returns Resolves once the hub is listening; never resolves during
 *          normal operation (the process stays alive until a signal).
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

  const hub = new DevtoolsHub({ port, historySize });

  // Graceful shutdown
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
  } catch (err) {
    console.error("Failed to start DevTools hub:", err);
    process.exit(1);
  }
}
