import { DevtoolsRole, type StoreCapabilities } from "@yoltra/devtools-protocol";
import type { WebSocket } from "ws";
import { describe, expect, it } from "vitest";

import type { ConnectionInfo } from "../src/connection";
import { Router } from "../src/router";

/** A minimal WebSocket stand-in that records what the router sends to it. */
function fakeWs(open = true) {
  const sent: string[] = [];
  const ws = {
    OPEN: 1,
    readyState: open ? 1 : 3,
    send: (msg: string) => void sent.push(msg),
    sent,
  };
  return ws as unknown as WebSocket & { sent: string[] };
}

const CAPS = {} as StoreCapabilities;

function storeConn(id: string, ws: WebSocket, name = id): ConnectionInfo {
  return {
    id,
    role: DevtoolsRole.STORE,
    ws,
    connectedAt: "2026-01-01T00:00:00.000Z",
    storeInfo: { name, capabilities: CAPS },
  };
}

function extConn(id: string, ws: WebSocket): ConnectionInfo {
  return { id, role: DevtoolsRole.EXTENSION, ws, connectedAt: "2026-01-01T00:00:00.000Z" };
}

describe("Router — registration + counts", () => {
  it("tracks stores and extensions separately", () => {
    const router = new Router();
    router.register(storeConn("s1", fakeWs()));
    router.register(storeConn("s2", fakeWs()));
    router.register(extConn("e1", fakeWs()));

    expect(router.storeCount).toBe(2);
    expect(router.extensionCount).toBe(1);

    router.unregister("s1", DevtoolsRole.STORE);
    expect(router.storeCount).toBe(1);
    expect(router.getStoreSocket("s1")).toBeUndefined();
    expect(router.getStoreSocket("s2")).toBeDefined();
  });
});

describe("Router — fan-out to extensions", () => {
  it("sends to every OPEN extension and skips closed ones", () => {
    const router = new Router();
    const open1 = fakeWs(true);
    const open2 = fakeWs(true);
    const closed = fakeWs(false);
    router.register(extConn("e1", open1));
    router.register(extConn("e2", open2));
    router.register(extConn("e3", closed));

    router.fanOutToExtensions("hello");

    expect((open1 as any).sent).toEqual(["hello"]);
    expect((open2 as any).sent).toEqual(["hello"]);
    expect((closed as any).sent).toEqual([]); // closed socket skipped
  });
});

describe("Router — targeted delivery to a store", () => {
  it("routes to the addressed store and reports success", () => {
    const router = new Router();
    const s1 = fakeWs();
    const s2 = fakeWs();
    router.register(storeConn("s1", s1));
    router.register(storeConn("s2", s2));

    expect(router.sendToStore("s1", "cmd")).toBe(true);
    expect((s1 as any).sent).toEqual(["cmd"]);
    expect((s2 as any).sent).toEqual([]);
  });

  it("returns false for an unknown or closed store", () => {
    const router = new Router();
    const closed = fakeWs(false);
    router.register(storeConn("s1", closed));

    expect(router.sendToStore("nope", "cmd")).toBe(false);
    expect(router.sendToStore("s1", "cmd")).toBe(false); // socket not open
    expect((closed as any).sent).toEqual([]);
  });
});

describe("Router — lifecycle + registry messages", () => {
  it("builds a STORE_CONNECTED message from a registered store", () => {
    const router = new Router();
    const info = storeConn("s1", fakeWs(), "Orbital");
    const raw = router.buildStoreConnectedMessage(info);
    expect(raw).not.toBeNull();
    const msg = JSON.parse(raw!);
    expect(msg.type).toBe("STORE_CONNECTED");
    expect(msg.store).toMatchObject({ id: "s1", name: "Orbital" });
    expect(msg.sourceRole).toBe(DevtoolsRole.HUB);
  });

  it("returns null for a connection without completed store info", () => {
    const router = new Router();
    const incomplete: ConnectionInfo = {
      id: "s1",
      role: DevtoolsRole.STORE,
      ws: fakeWs(),
      connectedAt: "2026-01-01T00:00:00.000Z",
    };
    expect(router.buildStoreConnectedMessage(incomplete)).toBeNull();
  });

  it("lists only fully-registered stores in the registry", () => {
    const router = new Router();
    router.register(storeConn("s1", fakeWs(), "Alpha"));
    router.register({
      // Registered but handshake never populated storeInfo — must be skipped.
      id: "s2",
      role: DevtoolsRole.STORE,
      ws: fakeWs(),
      connectedAt: "2026-01-01T00:00:00.000Z",
    });

    const registry = JSON.parse(router.buildRegistryMessage());
    expect(registry.type).toBe("STORE_REGISTRY");
    expect(registry.stores).toHaveLength(1);
    expect(registry.stores[0]).toMatchObject({ id: "s1", name: "Alpha", status: "connected" });
  });

  it("builds a STORE_DISCONNECTED message carrying the reason", () => {
    const router = new Router();
    const msg = JSON.parse(router.buildStoreDisconnectedMessage("s1", "socket closed"));
    expect(msg.type).toBe("STORE_DISCONNECTED");
    expect(msg.storeId).toBe("s1");
    expect(msg.reason).toBe("socket closed");
  });
});
