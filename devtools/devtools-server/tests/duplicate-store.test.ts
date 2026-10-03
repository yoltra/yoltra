import { DevtoolsRole, PROTOCOL_VERSION, duplicateStoreIdError } from "@yoltra/devtools-protocol";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { MockInstance } from "vitest";
import WebSocket from "ws";

import { createServer } from "node:net";

import { DevtoolsHub } from "../src/hub";

/**
 * Two stores presenting one id.
 *
 * An agent defaults its store id to the store's name, so two stores created with the same name
 * and no explicit `storeId` arrive with the same id. The router keys stores by id: registering
 * the second used to replace the first without a word, events from both were fanned out under one
 * id, commands reached only the newer one, and when either disconnected the entry of the other was
 * removed with it. The hub now refuses the second, naming the id, until the first has gone.
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

let warn: MockInstance;
beforeEach(() => {
  warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
});

const started: DevtoolsHub[] = [];
const sockets: WebSocket[] = [];
afterEach(async () => {
  for (const ws of sockets.splice(0)) ws.close();
  for (const hub of started.splice(0)) await hub.stop();
  vi.restoreAllMocks();
});

async function startHub() {
  const port = await getFreePort();
  const hub = new DevtoolsHub({ port });
  await hub.start();
  started.push(hub);
  return { hub, port };
}

/** Connects as a store and resolves with the socket and the hub's handshake response. */
function connectStore(
  port: number,
  id: string,
): Promise<{ ws: WebSocket; response: Record<string, unknown> }> {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(`ws://127.0.0.1:${port}`);
    sockets.push(ws);
    const timer = setTimeout(() => reject(new Error("no handshake response")), 3000);
    ws.on("error", reject);
    ws.on("open", () => {
      ws.send(
        JSON.stringify({
          type: "HANDSHAKE_REQUEST",
          protocolVersion: PROTOCOL_VERSION,
          role: DevtoolsRole.STORE,
          store: { id, name: id, capabilities: {} },
        }),
      );
    });
    ws.on("message", (data) => {
      const msg = JSON.parse(String(data)) as Record<string, unknown>;
      if (msg.type !== "HANDSHAKE_RESPONSE") return;
      clearTimeout(timer);
      resolve({ ws, response: msg });
    });
  });
}

function closed(ws: WebSocket): Promise<void> {
  return new Promise((resolve) => {
    if (ws.readyState === ws.CLOSED) return resolve();
    ws.once("close", () => resolve());
    ws.close();
  });
}

async function until(fn: () => boolean): Promise<void> {
  const start = Date.now();
  while (!fn()) {
    if (Date.now() - start > 3000) throw new Error("condition not reached");
    await new Promise((r) => setTimeout(r, 10));
  }
}

describe("a store id that is already connected", () => {
  it("refuses the second store and names the id", async () => {
    const { hub, port } = await startHub();

    const first = await connectStore(port, "App");
    const second = await connectStore(port, "App");

    expect(first.response.success).toBe(true);
    expect(second.response.success).toBe(false);
    expect(second.response.error).toBe(duplicateStoreIdError("App"));
    expect(hub.storeCount).toBe(1);
    const message = warn.mock.calls.map((c) => String(c[0])).find((m) => m.includes("App"));
    expect(message).toContain("already connected");
  });

  it("keeps the first store registered when the refused one leaves", async () => {
    const { hub, port } = await startHub();

    await connectStore(port, "App");
    const second = await connectStore(port, "App");
    await closed(second.ws);
    // Give the hub a moment to process the close it was sent.
    await new Promise((r) => setTimeout(r, 50));

    expect(hub.storeCount).toBe(1);
  });

  it("admits the id again once the first store has gone", async () => {
    const { hub, port } = await startHub();

    const first = await connectStore(port, "App");
    await closed(first.ws);
    await until(() => hub.storeCount === 0);

    const again = await connectStore(port, "App");
    expect(again.response.success).toBe(true);
    expect(hub.storeCount).toBe(1);
  });

  it("admits stores whose ids differ", async () => {
    const { hub, port } = await startHub();

    await connectStore(port, "App");
    const other = await connectStore(port, "App-2");

    expect(other.response.success).toBe(true);
    expect(hub.storeCount).toBe(2);
  });
});
