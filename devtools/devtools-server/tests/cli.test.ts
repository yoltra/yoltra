import { DevtoolsRole, PROTOCOL_VERSION } from "@yoltra/devtools-protocol";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { MockInstance } from "vitest";
import WebSocket from "ws";

import { createServer } from "node:net";

import { main } from "../src/cli";

/**
 * The standalone hub's token, from `--token` or `YOLTRA_DEVTOOLS_TOKEN`.
 *
 * `main` owns the process: it installs interrupt handlers and exits on failure. The test keeps
 * both away from the runner, holding on to the interrupt handler so it can stop the hub it
 * started.
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

/** Sends one extension handshake and resolves with whether the hub accepted it. */
function handshake(port: number, authToken?: string): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(`ws://127.0.0.1:${port}`);
    const timer = setTimeout(() => reject(new Error("no handshake response")), 3000);
    ws.on("error", reject);
    ws.on("open", () => {
      ws.send(
        JSON.stringify({
          type: "HANDSHAKE_REQUEST",
          protocolVersion: PROTOCOL_VERSION,
          role: DevtoolsRole.EXTENSION,
          ...(authToken !== undefined ? { authToken } : {}),
          extension: { id: "panel-1", name: "Test Panel", capabilities: {} },
        }),
      );
    });
    ws.on("message", (data) => {
      const msg = JSON.parse(String(data)) as { type?: string; success?: boolean };
      if (msg.type !== "HANDSHAKE_RESPONSE") return;
      clearTimeout(timer);
      ws.close();
      resolve(msg.success === true);
    });
  });
}

let stopHub: (() => Promise<void>) | undefined;
let exit: MockInstance<typeof process.exit>;
let error: MockInstance<typeof console.error>;

beforeEach(() => {
  stopHub = undefined;
  const on = process.on.bind(process);
  vi.spyOn(process, "on").mockImplementation(((event: string, handler: () => Promise<void>) => {
    if (event === "SIGINT") {
      stopHub = handler;
      return process;
    }
    if (event === "SIGTERM") return process;
    return on(event as never, handler as never);
  }) as never);
  exit = vi.spyOn(process, "exit").mockImplementation((() => undefined) as never);
  error = vi.spyOn(console, "error").mockImplementation(() => undefined);
  vi.spyOn(console, "log").mockImplementation(() => undefined);
  vi.spyOn(console, "warn").mockImplementation(() => undefined);
});

afterEach(async () => {
  await stopHub?.();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

async function start(...flags: string[]): Promise<number> {
  const port = await getFreePort();
  await main(["node", "devtools-server", "--port", String(port), ...flags]);
  return port;
}

describe("the standalone hub's token", () => {
  it("is taken from --token", async () => {
    const port = await start("--token", "s3cret");

    expect(await handshake(port, "s3cret")).toBe(true);
    expect(await handshake(port, "wrong")).toBe(false);
    expect(await handshake(port)).toBe(false);
  });

  it("is taken from --token=", async () => {
    const port = await start("--token=s3cret");

    expect(await handshake(port, "s3cret")).toBe(true);
    expect(await handshake(port, "wrong")).toBe(false);
  });

  it("is taken from YOLTRA_DEVTOOLS_TOKEN", async () => {
    vi.stubEnv("YOLTRA_DEVTOOLS_TOKEN", "from-env");
    const port = await start();

    expect(await handshake(port, "from-env")).toBe(true);
    expect(await handshake(port, "wrong")).toBe(false);
  });

  it("prefers --token over the environment", async () => {
    vi.stubEnv("YOLTRA_DEVTOOLS_TOKEN", "from-env");
    const port = await start("--token", "from-flag");

    expect(await handshake(port, "from-flag")).toBe(true);
    expect(await handshake(port, "from-env")).toBe(false);
  });

  it("is not required when neither is given", async () => {
    vi.stubEnv("YOLTRA_DEVTOOLS_TOKEN", "");
    const port = await start();

    expect(await handshake(port)).toBe(true);
  });

  it("refuses --token without a value instead of starting an open hub", async () => {
    await start("--token");

    expect(exit).toHaveBeenCalledWith(2);
    expect(String(error.mock.calls[0]?.[0])).toContain("--token needs a value");
    expect(stopHub).toBeUndefined();
  });
});
