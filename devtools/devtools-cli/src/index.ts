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
import { hubOptions, panelConfig } from "./session";

/**
 * The command-line surface, re-exported so the package's declared types entry point resolves to
 * something.
 *
 * `package.json` advertises `exports["."].types`, but this module exported nothing, so the
 * published `.d.ts` was empty and the generated API reference was a title with no body. These are
 * the same symbols the binary itself parses its arguments with, and the same ones the test suite
 * already covers — publishing them costs nothing and lets a caller embedding the hub reuse the
 * argument contract instead of re-deriving it.
 */
export { CliArgsError, DEFAULT_HISTORY_SIZE, DEFAULT_PORT, TOKEN_ENV, parseArgs } from "./args";
export type { CliArgs } from "./args";

async function main() {
  const args = parseArgs(process.argv.slice(2), process.env);
  const { port } = args;

  // Start embedded hub (or skip if one is already running). Either way the panel presents the
  // token, so it is admitted by a running hub that was started with the same one.
  const hub = new DevtoolsHub(hubOptions(args));
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

  // Render the Ink app with an explicit WebSocket implementation
  const { waitUntilExit } = render(
    createElement(App, {
      config: panelConfig(args, WebSocket as any),
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
