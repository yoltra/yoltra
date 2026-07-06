import { describe, it, expect } from "vitest";

import { DevtoolsRole, PROTOCOL_VERSION } from "@yoltra/devtools-protocol";

import { createLoopbackHub } from "../src/transport/loopback";

/** Flush microtasks + macrotask so queued deliveries settle. */
const tick = () => new Promise((r) => setTimeout(r, 0));

type AnyMsg = Record<string, any>;

describe("loopback transport (in-memory hub)", () => {
  it("handshakes both sides, fans a store event to the extension, and routes a command back", async () => {
    const hub = createLoopbackHub();

    // --- Store agent side (via the injected socket factory) ---
    const agentRaw: string[] = [];
    let agentOpen = false;
    const agent = hub.agentSocketFactory("ws://loopback", {
      onOpen: () => {
        agentOpen = true;
      },
      onMessage: (d) => agentRaw.push(d),
      onClose: () => {},
      onError: () => {},
    });
    await tick();
    expect(agentOpen).toBe(true);

    agent.send(
      JSON.stringify({
        type: "HANDSHAKE_REQUEST",
        protocolVersion: PROTOCOL_VERSION,
        role: DevtoolsRole.STORE,
        store: { id: "s1", name: "Store One", capabilities: { replay: true } },
      }),
    );

    // --- Panel side (via the WebSocket-compatible class) ---
    const ext = new hub.WebSocket("ws://loopback");
    const extMsgs: AnyMsg[] = [];
    (ext as unknown as { onmessage: (ev: { data: string }) => void }).onmessage = (ev) =>
      extMsgs.push(JSON.parse(ev.data));
    await tick();

    ext.send(
      JSON.stringify({
        type: "HANDSHAKE_REQUEST",
        protocolVersion: PROTOCOL_VERSION,
        role: DevtoolsRole.EXTENSION,
        extension: { id: "e1", name: "Panel", capabilities: {} },
      }),
    );
    await tick();

    // The panel handshakes successfully and learns about the store.
    expect(extMsgs.some((m) => m.type === "HANDSHAKE_RESPONSE" && m.success)).toBe(true);
    expect(
      extMsgs.some(
        (m) =>
          (m.type === "STORE_REGISTRY" && m.stores.some((s: AnyMsg) => s.id === "s1")) ||
          (m.type === "STORE_CONNECTED" && m.store?.id === "s1"),
      ),
    ).toBe(true);

    // A STORE_EVENT from the store fans out to the panel.
    const extBefore = extMsgs.length;
    agent.send(
      JSON.stringify({
        type: "STORE_EVENT",
        storeId: "s1",
        event: { id: "evt-1", channel: "ui", type: "increment", payload: 5 },
        patches: [{ op: "replace", path: "/counter/value", value: 5 }],
        snapshotVersion: 1,
        committed: true,
      }),
    );
    await tick();

    const storeEvent = extMsgs
      .slice(extBefore)
      .find((m) => m.type === "STORE_EVENT" && m.storeId === "s1");
    expect(storeEvent).toBeTruthy();
    expect(storeEvent!.patches).toContainEqual({ op: "replace", path: "/counter/value", value: 5 });

    // A TIME_TRAVEL command from the panel routes back to the store (by storeId).
    const agentBefore = agentRaw.length;
    ext.send(
      JSON.stringify({
        type: "TIME_TRAVEL",
        storeId: "s1",
        state: { counter: { value: 999 } },
        snapshotVersion: 2,
      }),
    );
    await tick();

    const command = agentRaw
      .slice(agentBefore)
      .map((s) => JSON.parse(s) as AnyMsg)
      .find((m) => m.type === "TIME_TRAVEL");
    expect(command).toBeTruthy();
    expect(command!.state).toEqual({ counter: { value: 999 } });
  });

  it("does not deliver a store's messages back to itself", async () => {
    const hub = createLoopbackHub();
    const agentRaw: string[] = [];
    const agent = hub.agentSocketFactory("ws://loopback", {
      onOpen: () => {},
      onMessage: (d) => agentRaw.push(d),
      onClose: () => {},
      onError: () => {},
    });
    await tick();
    agent.send(
      JSON.stringify({
        type: "HANDSHAKE_REQUEST",
        protocolVersion: PROTOCOL_VERSION,
        role: DevtoolsRole.STORE,
        store: { id: "s1", name: "S1", capabilities: {} },
      }),
    );
    await tick();

    const before = agentRaw.length;
    agent.send(JSON.stringify({ type: "STORE_EVENT", storeId: "s1", patches: [], committed: true }));
    await tick();

    // No extension is connected, and a store never receives its own fan-out.
    expect(agentRaw.slice(before).some((s) => JSON.parse(s).type === "STORE_EVENT")).toBe(false);
  });
});
