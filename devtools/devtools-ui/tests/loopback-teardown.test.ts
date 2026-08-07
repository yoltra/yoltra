import { describe, it, expect } from "vitest";

import { DevtoolsRole, PROTOCOL_VERSION } from "@yoltra/devtools-protocol";

import { createLoopbackHub } from "../src/transport/loopback";

/** Flush microtasks + macrotask so queued deliveries settle. */
const tick = () => new Promise((r) => setTimeout(r, 0));

type AnyMsg = Record<string, any>;

const handshake = (role: DevtoolsRole, id: string) =>
  JSON.stringify({
    type: "HANDSHAKE_REQUEST",
    protocolVersion: PROTOCOL_VERSION,
    role,
    ...(role === DevtoolsRole.STORE
      ? { store: { id, name: id, capabilities: {} } }
      : { extension: { id, name: id, capabilities: {} } }),
  });

/** An agent handle plus the raw frames the hub pushed to it. */
function connectAgent(hub: ReturnType<typeof createLoopbackHub>) {
  const received: AnyMsg[] = [];
  const socket = hub.agentSocketFactory("ws://loopback", {
    onOpen: () => {},
    onMessage: (raw) => received.push(JSON.parse(raw) as AnyMsg),
    onClose: () => {},
    onError: () => {},
  });
  return { socket, received };
}

/** A panel socket plus the messages it saw. */
function connectPanel(hub: ReturnType<typeof createLoopbackHub>) {
  const socket = new hub.WebSocket("ws://loopback");
  const received: AnyMsg[] = [];
  (socket as unknown as { onmessage: (ev: { data: string }) => void }).onmessage = (ev) =>
    received.push(JSON.parse(ev.data) as AnyMsg);
  return { socket, received };
}

describe("a store leaving the loopback hub", () => {
  it("tells every panel the store is gone, and says it once", async () => {
    const hub = createLoopbackHub();

    const agent = connectAgent(hub);
    await tick();
    // The handle reports the socket state the panel code branches on.
    expect(agent.socket.readyState).toBe(1);
    agent.socket.send(handshake(DevtoolsRole.STORE, "s1"));

    const panel = connectPanel(hub);
    await tick();
    panel.socket.send(handshake(DevtoolsRole.EXTENSION, "e1"));
    await tick();

    agent.socket.close();
    await tick();

    // Without this the panel keeps a departed store in its registry forever: nothing else
    // in the protocol tells it the agent is gone.
    const gone = panel.received.find((m) => m.type === "STORE_DISCONNECTED");
    expect(gone).toBeTruthy();
    expect(gone!.storeId).toBe("s1");
    expect(gone!.reason).toBe("disconnected");
    expect(agent.socket.readyState).toBe(3);

    // A second close must not announce a second departure — the broker deletes the peer on
    // the first one, and a duplicate would look like a store that left twice.
    const settled = panel.received.length;
    agent.socket.close();
    await tick();
    expect(panel.received).toHaveLength(settled);
  });

  it("stops relaying once the store has closed", async () => {
    const hub = createLoopbackHub();

    const agent = connectAgent(hub);
    await tick();
    agent.socket.send(handshake(DevtoolsRole.STORE, "s1"));

    const panel = connectPanel(hub);
    await tick();
    panel.socket.send(handshake(DevtoolsRole.EXTENSION, "e1"));
    await tick();

    agent.socket.close();
    await tick();
    const settled = panel.received.length;

    agent.socket.send(
      JSON.stringify({ type: "STORE_EVENT", storeId: "s1", patches: [], committed: true }),
    );
    await tick();
    expect(panel.received).toHaveLength(settled);
  });
});

describe("closing the panel's own socket", () => {
  it("marks it closed and tolerates a second close", async () => {
    const hub = createLoopbackHub();
    const panel = connectPanel(hub);
    await tick();
    panel.socket.send(handshake(DevtoolsRole.EXTENSION, "e1"));
    await tick();

    let closes = 0;
    (panel.socket as unknown as { onclose: () => void }).onclose = () => {
      closes += 1;
    };

    panel.socket.close();
    expect(panel.socket.readyState).toBe(3);
    expect(closes).toBe(1);

    panel.socket.close();
    expect(closes).toBe(1);
  });
});

describe("disposing an agent handle", () => {
  it("detaches the peer without announcing a departure", async () => {
    const hub = createLoopbackHub();

    const agent = connectAgent(hub);
    await tick();
    agent.socket.send(handshake(DevtoolsRole.STORE, "s1"));

    const panel = connectPanel(hub);
    await tick();
    panel.socket.send(handshake(DevtoolsRole.EXTENSION, "e1"));
    await tick();
    const settled = panel.received.length;

    // `dispose` is the teardown the agent uses when it is replacing its own transport, not
    // when the store is going away — so it must not tell the panel the store disconnected.
    agent.socket.dispose();
    await tick();
    expect(panel.received).toHaveLength(settled);
    expect(panel.received.some((m) => m.type === "STORE_DISCONNECTED")).toBe(false);

    // The peer is detached all the same: nothing it sends is relayed.
    agent.socket.send(
      JSON.stringify({ type: "STORE_EVENT", storeId: "s1", patches: [], committed: true }),
    );
    await tick();
    expect(panel.received).toHaveLength(settled);
  });
});
