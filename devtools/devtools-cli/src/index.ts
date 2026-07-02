/**
 * @module @yoltra/devtools-cli
 *
 * Yoltra DevTools terminal UI built with React + Ink.
 * Embeds a DevTools hub and renders a TUI for inspecting stores.
 */

import { DevtoolsHub } from "@yoltra/devtools-server";
import { render } from "ink";
import { createElement } from "react";
import { WebSocket } from "ws";
import { App } from "./app";

const DEFAULT_PORT = 9800;
const DEFAULT_HISTORY_SIZE = 1000;

async function main() {
  const args = process.argv.slice(2);
  const port = getArg(args, "--port", DEFAULT_PORT);
  const historySize = getArg(args, "--history-size", DEFAULT_HISTORY_SIZE);

  // Start embedded hub (or skip if one is already running)
  const hub = new DevtoolsHub({ port, historySize });
  const alreadyRunning = await DevtoolsHub.probe(port);

  if (!alreadyRunning) {
    await hub.start();
    process.on("SIGINT", async () => {
      await hub.stop();
      process.exit(0);
    });
    process.on("SIGTERM", async () => {
      await hub.stop();
      process.exit(0);
    });
  }

  // Render Ink app (pass ws WebSocket for Node.js compatibility)
  const { waitUntilExit } = render(
    createElement(App, {
      config: {
        host: "localhost",
        port,
        extensionName: "CLI DevTools",
        autoReconnect: true,
        WebSocket: WebSocket as any,
      },
    }),
  );

  await waitUntilExit();

  if (!alreadyRunning) {
    await hub.stop();
  }
}

function getArg(args: string[], flag: string, defaultValue: number): number {
  const idx = args.indexOf(flag);
  if (idx >= 0 && idx + 1 < args.length) {
    const val = parseInt(args[idx + 1], 10);
    if (!isNaN(val)) return val;
  }
  return defaultValue;
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
