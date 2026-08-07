import { describe, it, expect } from "vitest";

import { DevtoolsRole, PROTOCOL_VERSION } from "@yoltra/devtools-protocol";

import { createLoopbackHub } from "../src/transport/loopback";

/** Flush microtasks + macrotask so queued deliveries settle. */
const tick = () => new Promise((r) => setTimeout(r, 0));

type AnyMsg = Record<string, any>;

/** A freshly connected agent handle plus the frames the hub pushed back. */
function connect() {
  const hub = createLoopbackHub();
  const received: AnyMsg[] = [];
  const socket = hub.agentSocketFactory("ws://loopback", {
    onOpen: () => {},
    onMessage: (raw) => received.push(JSON.parse(raw) as AnyMsg),
    onClose: () => {},
    onError: () => {},
  });
  return { hub, socket, received };
}

const response = (received: AnyMsg[]) => received.find((m) => m.type === "HANDSHAKE_RESPONSE");

describe("the loopback hub refuses what the real hub refuses", () => {
  it("rejects a handshake from an incompatible protocol major", async () => {
    const { socket, received } = connect();
    await tick();

    socket.send(
      JSON.stringify({
        type: "HANDSHAKE_REQUEST",
        protocolVersion: "99.0.0",
        role: DevtoolsRole.STORE,
        store: { id: "s1", name: "s1", capabilities: {} },
      }),
    );

    // Answering at all matters as much as refusing: a silent drop leaves the agent waiting
    // on a handshake that will never arrive.
    expect(response(received)?.success).toBe(false);
    expect(response(received)?.error).toMatch(/rejected/i);
    expect(response(received)?.negotiatedVersion).toBe(PROTOCOL_VERSION);
  });

  it("rejects a store that names no id", async () => {
    const { socket, received } = connect();
    await tick();

    socket.send(
      JSON.stringify({
        type: "HANDSHAKE_REQUEST",
        protocolVersion: PROTOCOL_VERSION,
        role: DevtoolsRole.STORE,
      }),
    );

    expect(response(received)?.success).toBe(false);
  });

  it("rejects a role that is neither a store nor an extension", async () => {
    const { socket, received } = connect();
    await tick();

    socket.send(
      JSON.stringify({
        type: "HANDSHAKE_REQUEST",
        protocolVersion: PROTOCOL_VERSION,
        role: DevtoolsRole.HUB,
        store: { id: "s1", name: "s1", capabilities: {} },
      }),
    );

    expect(response(received)?.success).toBe(false);
  });

  it("stays silent for anything that is not a handshake, before one has happened", async () => {
    const { socket, received } = connect();
    await tick();

    socket.send(JSON.stringify({ type: "STORE_EVENT", storeId: "s1", patches: [] }));
    await tick();

    expect(received).toHaveLength(0);
  });
});

describe("malformed frames reaching the loopback hub", () => {
  it("drops them instead of throwing", async () => {
    const { socket, received } = connect();
    await tick();

    // A peer that can crash the broker takes the panel down with it, and in the embedded
    // demo there is no server process left to inspect afterwards.
    expect(() => socket.send("not json at all")).not.toThrow();
    expect(() => socket.send("null")).not.toThrow();
    expect(() => socket.send(JSON.stringify(["an", "array"]))).not.toThrow();
    expect(() => socket.send(JSON.stringify({ noType: true }))).not.toThrow();
    expect(() => socket.send(JSON.stringify({ type: 42 }))).not.toThrow();

    await tick();
    expect(received).toHaveLength(0);
  });

  it("still handshakes normally afterwards", async () => {
    const { socket, received } = connect();
    await tick();

    socket.send("{{{");
    socket.send(
      JSON.stringify({
        type: "HANDSHAKE_REQUEST",
        protocolVersion: PROTOCOL_VERSION,
        role: DevtoolsRole.STORE,
        store: { id: "s1", name: "s1", capabilities: {} },
      }),
    );
    await tick();

    expect(response(received)?.success).toBe(true);
  });
});
