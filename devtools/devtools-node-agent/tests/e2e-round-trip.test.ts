import { createServer } from "node:net";

import { afterEach, describe, expect, it } from "vitest";
import { WebSocket } from "ws";

import { createStore, type ReducerSpec } from "@yoltra/core";
import { DevtoolsRole, PROTOCOL_VERSION } from "@yoltra/devtools-protocol";
import { DevtoolsHub } from "@yoltra/devtools-server";

import { withNodetools } from "../src/withNodetools";

/**
 * End-to-end smoke test of the full DevTools loop over real WebSockets:
 *
 *   store + node agent  ──▶  hub  ──▶  mock extension client
 *                  store  ◀──  hub  ◀──  (TIME_TRAVEL command)
 *
 * Proves that a committed event streams out as an RFC-6902 patch and that a
 * time-travel command sent from the "extension" side round-trips back through
 * the hub and mutates the real store. This is the same wire the browser agent
 * uses; only the socket transport differs.
 */

// ---- helpers ---------------------------------------------------------------

/** Ask the OS for an unused TCP port so parallel/CI runs don't collide. */
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

/** Poll `fn` until it returns a truthy value, or throw after `timeout` ms. */
async function waitFor<T>(
  fn: () => T | undefined | false,
  { timeout = 5000, interval = 20, label = "condition" } = {},
): Promise<T> {
  const start = Date.now();
  for (;;) {
    const v = fn();
    if (v !== undefined && v !== false) return v as T;
    if (Date.now() - start > timeout) throw new Error(`waitFor timed out: ${label}`);
    await new Promise((r) => setTimeout(r, interval));
  }
}

type AnyMsg = Record<string, any>;

/** A minimal extension client: connects, records every message it receives. */
function connectExtension(port: number) {
  const ws = new WebSocket(`ws://localhost:${port}`);
  const messages: AnyMsg[] = [];
  ws.on("message", (data) => {
    try {
      messages.push(JSON.parse(data.toString()));
    } catch {
      /* ignore malformed frames */
    }
  });
  const opened = new Promise<void>((resolve, reject) => {
    ws.once("open", () => resolve());
    ws.once("error", reject);
  });
  return { ws, messages, opened };
}

// ---- store under test ------------------------------------------------------

type EM = { ui: { increment: number } };

const counterSpec: ReducerSpec<{ value: number }, EM> = {
  state: { value: 0 },
  events: [["ui", "increment"]],
  reducer: (s, e) => (e.type === "increment" ? { value: s.value + (e.payload as number) } : s),
};

// ---- test ------------------------------------------------------------------

describe("DevTools end-to-end round-trip (node agent <-> hub <-> extension)", () => {
  const cleanups: Array<() => void | Promise<void>> = [];

  afterEach(async () => {
    for (const c of cleanups.splice(0).reverse()) {
      try {
        await c();
      } catch {
        /* best-effort teardown */
      }
    }
  });

  it("streams a committed event as a patch and applies a time-travel command back to the store", async () => {
    const port = await getFreePort();

    // 1. Hub
    const hub = new DevtoolsHub({ port });
    await hub.start();
    cleanups.push(() => hub.stop());

    // 2. Store + node agent, with replay enabled at BOTH the core and the agent.
    const store = createStore({
      name: "e2e-counter",
      reducer: { counter: counterSpec },
      devtools: { allowReplay: true },
    });
    withNodetools(store, { port, storeId: "e2e-store", allowReplay: true });
    cleanups.push(() => store.dispose());

    // 3. Mock extension client + handshake.
    const ext = connectExtension(port);
    cleanups.push(() => ext.ws.close());
    await ext.opened;
    ext.ws.send(
      JSON.stringify({
        type: "HANDSHAKE_REQUEST",
        protocolVersion: PROTOCOL_VERSION,
        role: DevtoolsRole.EXTENSION,
        extension: { id: "ext-e2e", name: "E2E Extension", capabilities: {} },
      }),
    );

    // 4. Wait until the extension learns about our store (registry OR live connect).
    await waitFor(
      () =>
        ext.messages.some(
          (m) =>
            (m.type === "STORE_CONNECTED" && m.store?.id === "e2e-store") ||
            (m.type === "STORE_REGISTRY" &&
              Array.isArray(m.stores) &&
              m.stores.some((s: AnyMsg) => s.id === "e2e-store")),
        ),
      { label: "store registered at extension" },
    );

    const before = ext.messages.length;

    // 5. Emit -> the agent should stream a STORE_EVENT carrying a replace patch.
    await store.emit("ui", "increment", 5);

    const storeEvent = await waitFor(
      () =>
        ext.messages
          .slice(before)
          .find((m) => m.type === "STORE_EVENT" && m.storeId === "e2e-store" && m.committed),
      { label: "STORE_EVENT received" },
    );

    expect(storeEvent.patches).toContainEqual({
      op: "replace",
      path: "/counter/value",
      value: 5,
    });
    expect(store.getState().counter.value).toBe(5);

    // 6. Extension -> TIME_TRAVEL command -> hub routes to store -> agent applies it.
    ext.ws.send(
      JSON.stringify({
        type: "TIME_TRAVEL",
        storeId: "e2e-store",
        state: { counter: { value: 999 } },
        snapshotVersion: (storeEvent.snapshotVersion ?? 0) + 1,
        timestamp: new Date().toISOString(),
        sourceId: "ext-e2e",
        sourceRole: DevtoolsRole.EXTENSION,
      }),
    );

    // 7. The command round-trips and mutates the real store.
    await waitFor(() => store.getState().counter.value === 999, {
      label: "time-travel applied to store",
    });
    expect(store.getState().counter.value).toBe(999);
  });
});
