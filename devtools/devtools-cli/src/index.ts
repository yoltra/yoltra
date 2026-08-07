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
import { CliArgsError, parseArgs } from "./args";

async function main() {
  const { port, historySize } = parseArgs(process.argv.slice(2));

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

main().catch((err) => {
  // A bad flag is the user's mistake, not a crash: say what was wrong with it and stop, rather
  // than printing a stack trace from whichever dependency happened to reject the value.
  if (err instanceof CliArgsError) {
    console.error(err.message);
    process.exit(2);
  }
  console.error("Fatal:", err);
  process.exit(1);
});
