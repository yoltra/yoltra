import { createServer } from "node:net";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { MockInstance } from "vitest";
import { WebSocket } from "ws";

import { createStore, type ReducerSpec } from "@yoltra/core";
import { DevtoolsRole, PROTOCOL_VERSION } from "@yoltra/devtools-protocol";
import { DevtoolsHub } from "@yoltra/devtools-server";

import { withNodetools } from "../src/withNodetools";

/**
 * The id a store presents to the hub: `storeId`, or the store's name by default. Two stores with
 * the same name and no `storeId` therefore present one id, and the hub admits only the first.
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

async function waitFor(fn: () => boolean, timeout = 3000): Promise<boolean> {
  const start = Date.now();
  while (!fn()) {
    if (Date.now() - start > timeout) return false;
    await new Promise((r) => setTimeout(r, 20));
  }
  return true;
}

type EM = { ui: { increment: number } };

const counterSpec: ReducerSpec<{ value: number }, EM> = {
  state: { value: 0 },
  when: { keys: [["ui", "increment"]] },
  reducer: (s, e) => (e.type === "increment" ? { value: s.value + (e.payload as number) } : s),
};

/** Connects as a panel and resolves with the ids in the first store registry it is sent. */
function registryIds(port: number): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(`ws://127.0.0.1:${port}`);
    ws.on("error", reject);
    ws.on("open", () =>
      ws.send(
        JSON.stringify({
          type: "HANDSHAKE_REQUEST",
          protocolVersion: PROTOCOL_VERSION,
          role: DevtoolsRole.EXTENSION,
          extension: { id: "panel", name: "Panel", capabilities: {} },
        }),
      ),
    );
    ws.on("message", (data) => {
      const msg = JSON.parse(String(data)) as { type?: string; stores?: Array<{ id: string }> };
      if (msg.type !== "STORE_REGISTRY") return;
      ws.close();
      resolve((msg.stores ?? []).map((s) => s.id));
    });
  });
}

describe("the store id an agent presents", () => {
  const cleanups: Array<() => void | Promise<void>> = [];
  let error: MockInstance<typeof console.error>;

  beforeEach(() => {
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
    error = vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  afterEach(async () => {
    for (const c of cleanups.splice(0).reverse()) await c();
    vi.restoreAllMocks();
  });

  async function startHub() {
    const port = await getFreePort();
    const hub = new DevtoolsHub({ port });
    await hub.start();
    cleanups.push(() => hub.stop());
    return { hub, port };
  }

  function attach(port: number, name: string) {
    const store = createStore({ name, reducer: { counter: counterSpec } });
    withNodetools(store, { port, autoReconnect: false });
    cleanups.push(() => store.dispose());
  }

  it("is the store's name when no storeId is given", async () => {
    const { hub, port } = await startHub();
    attach(port, "Checkout");
    await waitFor(() => hub.storeCount === 1);

    expect(await registryIds(port)).toEqual(["Checkout"]);
  });

  it("is refused, by name, for a second store with the same name", async () => {
    const { hub, port } = await startHub();
    attach(port, "Checkout");
    await waitFor(() => hub.storeCount === 1);
    attach(port, "Checkout");

    expect(await waitFor(() => error.mock.calls.length > 0)).toBe(true);
    expect(String(error.mock.calls[0]?.[1])).toContain('Store id "Checkout" is already connected');
    expect(hub.storeCount).toBe(1);
  });
});
