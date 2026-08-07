import { createServer } from "node:net";

import { afterEach, describe, expect, it } from "vitest";
import { WebSocket } from "ws";

import { createStore, type ReducerSpec } from "@yoltra/core";
import { DevtoolsRole, PROTOCOL_VERSION } from "@yoltra/devtools-protocol";
import { DevtoolsHub } from "@yoltra/devtools-server";

import { withNodetools } from "../src/withNodetools";

/**
 * The redaction contract over the real wire: with `sanitize` configured, nothing the node
 * agent forwards — state snapshot, event payload, or patch — carries a matching value in the
 * clear. Same assertions as the browser agent's loopback suite, over actual sockets, because
 * a Node service is exactly the case where the hub sits on another machine.
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

type EM = { auth: { login: { token: string; note: string } } };
type VaultState = { user: string; token: string };

const vaultSpec: ReducerSpec<VaultState, EM> = {
  state: { user: "manu", token: "sk-live-111" },
  when: { keys: [["auth", "login"]] },
  reducer: (s, e) => (e.type === "login" ? { ...s, token: (e.payload as { token: string }).token } : s),
};

describe("the sanitize hook, over real sockets", () => {
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

  it("redacts snapshots, payloads and patches when configured", async () => {
    const port = await getFreePort();

    const hub = new DevtoolsHub({ port });
    await hub.start();
    cleanups.push(() => hub.stop());

    const store = createStore<{ vault: VaultState }, EM>({
      name: "vault",
      reducer: { vault: vaultSpec },
    });
    withNodetools(store, {
      port,
      storeId: "s-sanitize",
      sanitize: (path, value) => (/token/i.test(path) ? "[redacted]" : value),
    });
    cleanups.push(() => store.dispose());

    const ext = connectExtension(port);
    cleanups.push(() => ext.ws.close());
    await ext.opened;
    ext.ws.send(
      JSON.stringify({
        type: "HANDSHAKE_REQUEST",
        protocolVersion: PROTOCOL_VERSION,
        role: DevtoolsRole.EXTENSION,
        extension: { id: "ext-sanitize", name: "Sanitize Extension", capabilities: {} },
      }),
    );

    await waitFor(
      () =>
        ext.messages.some(
          (m) =>
            (m.type === "STORE_CONNECTED" && m.store?.id === "s-sanitize") ||
            (m.type === "STORE_REGISTRY" && m.stores?.some((s: AnyMsg) => s.id === "s-sanitize")),
        ),
      { label: "store visible to extension" },
    );

    ext.ws.send(
      JSON.stringify({
        type: "REQUEST_STATE",
        storeId: "s-sanitize",
        timestamp: new Date().toISOString(),
        sourceId: "ext-sanitize",
        sourceRole: DevtoolsRole.EXTENSION,
      }),
    );
    const snapshot = await waitFor(
      () => ext.messages.find((m) => m.type === "STATE_SNAPSHOT"),
      { label: "snapshot" },
    );
    expect(snapshot.state.vault.token).toBe("[redacted]");
    expect(snapshot.state.vault.user).toBe("manu");

    const before = ext.messages.length;
    await store.emit("auth", "login", { token: "sk-live-222", note: "hello" });
    const event = await waitFor(
      () => ext.messages.slice(before).find((m) => m.type === "STORE_EVENT" && m.committed),
      { label: "event at extension" },
    );

    expect(event.event.payload.token).toBe("[redacted]");
    expect(event.event.payload.note).toBe("hello");
    expect(event.patches).toContainEqual({
      op: "replace",
      path: "/vault/token",
      value: "[redacted]",
    });
    // Redaction happens at the wire; the live store keeps the real value.
    expect(store.getState().vault.token).toBe("sk-live-222");
  });
});
