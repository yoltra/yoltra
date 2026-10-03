import { DevtoolsHub } from "@yoltra/devtools-server";
import { render } from "ink-testing-library";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { MockInstance } from "vitest";
import { WebSocket } from "ws";

import { createServer } from "node:net";

import { App } from "../src/app";
import { parseArgs } from "../src/args";
import { hubOptions, panelConfig } from "../src/session";

/**
 * One token for the embedded hub and the terminal panel.
 *
 * The CLI is a hub and a panel in one process. Given a token, the hub it starts refuses every
 * client without it, the panel included, so the panel has to present the same value. This drives
 * the path the entry point takes: parse, build the hub from the arguments, and render the app
 * with the panel config built from the same arguments.
 */

function getFreePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const srv = createServer();
    srv.on("error", reject);
    srv.listen(0, () => {
      const addr = srv.address();
      const port = typeof addr === "object" && addr ? addr.port : 0;
      srv.close(() => resolve(port));
    });
  });
}

const pause = (ms: number) => new Promise((r) => setTimeout(r, ms));

const hubs: DevtoolsHub[] = [];
let app: ReturnType<typeof render> | undefined;
let warn: MockInstance<typeof console.warn>;

beforeEach(() => {
  // The hub warns when it refuses a client, which one case below does on purpose.
  warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
});

afterEach(async () => {
  app?.unmount();
  app = undefined;
  for (const hub of hubs.splice(0)) await hub.stop();
  vi.restoreAllMocks();
});

/** Starts a hub from `hubArgv` and renders the panel from `panelArgv`; returns the status line. */
async function session(hubArgv: string[], panelArgv: string[]) {
  const port = String(await getFreePort());
  const hub = new DevtoolsHub(hubOptions(parseArgs(["--port", port, ...hubArgv])));
  await hub.start();
  hubs.push(hub);

  const config = {
    ...panelConfig(parseArgs(["--port", port, ...panelArgv]), WebSocket as never),
    autoReconnect: false,
  };
  app = render(<App config={config} />);
  return { hub, frame: () => app?.lastFrame() ?? "" };
}

async function settle(fn: () => boolean): Promise<boolean> {
  const start = Date.now();
  while (!fn()) {
    if (Date.now() - start > 5000) return false;
    await pause(20);
  }
  return true;
}

describe("the CLI's token", { timeout: 30_000 }, () => {
  it("admits its own panel to the hub it started", async () => {
    const { hub, frame } = await session(["--token", "s3cret"], ["--token", "s3cret"]);

    expect(await settle(() => frame().includes("Hub: connected"))).toBe(true);
    expect(hub.extensionCount).toBe(1);
  });

  it("is refused by a hub started with another token", async () => {
    const { hub, frame } = await session(["--token", "s3cret"], ["--token", "wrong"]);

    // The hub's refusal is what ends the wait.
    expect(
      await settle(() => warn.mock.calls.some((c) => String(c[0]).includes("Rejected an extension"))),
    ).toBe(true);
    await pause(100);
    expect(frame()).not.toContain("Hub: connected");
    expect(hub.extensionCount).toBe(0);
  });

  it("passes nothing when there is no token", () => {
    const args = parseArgs([]);
    expect("authToken" in hubOptions(args)).toBe(false);
    expect("authToken" in panelConfig(args, WebSocket as never)).toBe(false);
  });
});
