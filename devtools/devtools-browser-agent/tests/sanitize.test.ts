import { afterEach, describe, expect, it } from "vitest";

import { createStore, type ReducerSpec } from "@yoltra/core";
import { DevtoolsRole, PROTOCOL_VERSION } from "@yoltra/devtools-protocol";
import { createLoopbackHub } from "@yoltra/devtools-ui";

import { withDevtools } from "../src/withDevtools";
import type { DevtoolsWrapperConfig } from "../src/types";

/**
 * The redaction contract: with `sanitize` configured, nothing the agent forwards — state
 * snapshot, event payload, or patch — carries a matching value in the clear. Asserted at the
 * panel's side of the wire, because that is where a leak would land.
 */

const tick = () => new Promise((r) => setTimeout(r, 0));

async function waitFor<T>(
  fn: () => T | undefined | false,
  { timeout = 2000, interval = 10, label = "condition" } = {},
): Promise<T> {
  const start = Date.now();
  for (;;) {
    const v = fn();
    if (v !== undefined && v !== false) return v as T;
    if (Date.now() - start > timeout) throw new Error(`waitFor timed out: ${label}`);
    await new Promise((r) => setTimeout(r, interval));
  }
}

type EM = { auth: { login: { token: string; note: string } } };
type VaultState = { user: string; token: string };
type AnyMsg = Record<string, any>;

const vaultSpec: ReducerSpec<VaultState, EM> = {
  state: { user: "manu", token: "sk-live-111" },
  when: { keys: [["auth", "login"]] },
  reducer: (s, e) => (e.type === "login" ? { ...s, token: (e.payload as { token: string }).token } : s),
};

describe("the sanitize hook, at the panel's side of the wire", () => {
  const cleanups: Array<() => void> = [];
  afterEach(() => {
    for (const c of cleanups.splice(0).reverse()) {
      try {
        c();
      } catch {
        /* best-effort */
      }
    }
  });

  async function attach(extra: Partial<DevtoolsWrapperConfig>) {
    const hub = createLoopbackHub();
    const store = createStore<{ vault: VaultState }, EM>({
      name: "vault",
      reducer: { vault: vaultSpec },
    });
    withDevtools(store, {
      port: 0,
      storeId: "s1",
      socketFactory: hub.agentSocketFactory,
      ...extra,
    });
    cleanups.push(() => store.dispose());

    const panel = new hub.WebSocket("ws://loopback");
    const msgs: AnyMsg[] = [];
    panel.onmessage = (ev) => msgs.push(JSON.parse(ev.data as string));
    cleanups.push(() => panel.close());
    await tick();
    panel.send(
      JSON.stringify({
        type: "HANDSHAKE_REQUEST",
        protocolVersion: PROTOCOL_VERSION,
        role: DevtoolsRole.EXTENSION,
        extension: { id: "panel-1", name: "Embedded Panel", capabilities: {} },
      }),
    );
    await waitFor(
      () =>
        msgs.some(
          (m) =>
            (m.type === "STORE_CONNECTED" && m.store?.id === "s1") ||
            (m.type === "STORE_REGISTRY" && m.stores?.some((s: AnyMsg) => s.id === "s1")),
        ),
      { label: "store visible to panel" },
    );

    const requestState = () =>
      panel.send(
        JSON.stringify({
          type: "REQUEST_STATE",
          storeId: "s1",
          timestamp: new Date().toISOString(),
          sourceId: "panel-1",
          sourceRole: DevtoolsRole.EXTENSION,
        }),
      );

    return { store, msgs, requestState };
  }

  it("redacts snapshots, payloads and patches when configured", async () => {
    const { store, msgs, requestState } = await attach({
      sanitize: (path, value) => (/token/i.test(path) ? "[redacted]" : value),
    });

    requestState();
    const snapshot = await waitFor(
      () => msgs.find((m) => m.type === "STATE_SNAPSHOT"),
      { label: "snapshot" },
    );
    expect(snapshot.state.vault.token).toBe("[redacted]");
    expect(snapshot.state.vault.user).toBe("manu");

    const before = msgs.length;
    await store.emit("auth", "login", { token: "sk-live-222", note: "hello" });
    const event = await waitFor(
      () => msgs.slice(before).find((m) => m.type === "STORE_EVENT" && m.committed),
      { label: "event at panel" },
    );

    // The payload that carried the secret in, and the patch that writes it into state, are
    // both redacted; everything else is intact.
    expect(event.event.payload.token).toBe("[redacted]");
    expect(event.event.payload.note).toBe("hello");
    expect(event.patches).toContainEqual({
      op: "replace",
      path: "/vault/token",
      value: "[redacted]",
    });
    // And the live store itself is untouched — redaction happens at the wire, not in state.
    expect(store.getState().vault.token).toBe("sk-live-222");
  });

  it("forwards everything in the clear when the hook is omitted — the default is not redaction", async () => {
    const { msgs, requestState } = await attach({});

    requestState();
    const snapshot = await waitFor(
      () => msgs.find((m) => m.type === "STATE_SNAPSHOT"),
      { label: "snapshot" },
    );
    expect(snapshot.state.vault.token).toBe("sk-live-111");
  });
});
