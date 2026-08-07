import { DevtoolsRole, PROTOCOL_VERSION } from "@yoltra/devtools-protocol";
import { afterEach, describe, expect, it, vi } from "vitest";
import WebSocket from "ws";

import { createServer } from "node:net";

import { DevtoolsHub } from "../src/hub";

/** Ask the OS for an unused TCP port so parallel runs never collide. */
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

/**
 * Who may connect to the hub.
 *
 * The hub binds to loopback, which keeps the network out — but loopback is not an
 * authentication boundary. Every other process on the machine can reach it, so without a token
 * anything running locally could connect as a panel and read the application's entire state,
 * inject events, and overwrite state through time-travel: a package install script, or another
 * tenant on a shared CI runner.
 */

const started: DevtoolsHub[] = [];
afterEach(async () => {
  for (const hub of started.splice(0)) await hub.stop();
});

async function startHub(authToken?: string) {
  const port = await getFreePort();
  const hub = new DevtoolsHub(authToken === undefined ? { port } : { port, authToken });
  await hub.start();
  started.push(hub);
  return { hub, port };
}

/** Sends one handshake and resolves with the hub's response. */
function handshake(port: number, authToken?: string): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(`ws://127.0.0.1:${port}`);
    const timer = setTimeout(() => {
      ws.close();
      reject(new Error("no handshake response"));
    }, 3000);

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
      const msg = JSON.parse(String(data)) as Record<string, unknown>;
      if (msg.type !== "HANDSHAKE_RESPONSE") return;
      clearTimeout(timer);
      ws.close();
      resolve(msg);
    });
    ws.on("error", (err) => {
      clearTimeout(timer);
      reject(err);
    });
  });
}

describe("hub authentication", () => {
  it("refuses a client that presents no token", async () => {
    const { hub, port } = await startHub("s3cret");

    const response = await handshake(port);

    expect(response.success).toBe(false);
    expect(String(response.error)).toContain("auth token");
  });

  it("refuses a client that presents the wrong token", async () => {
    const { hub, port } = await startHub("s3cret");

    const response = await handshake(port, "guessed");

    expect(response.success).toBe(false);
  });

  it("accepts the token it was configured with", async () => {
    const { hub, port } = await startHub("s3cret");

    const response = await handshake(port, "s3cret");

    expect(response.success).toBe(true);
  });

  it("registers nothing for a rejected client", async () => {
    const { hub, port } = await startHub("s3cret");

    await handshake(port, "wrong");

    // Refused before registration, so a client that fails the check never reaches the store
    // registry or the history buffer it would otherwise be replayed.
    expect(hub.extensionCount).toBe(0);
  });

  it("stays open when no token is configured, and says so once", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const { hub, port } = await startHub();

    const response = await handshake(port);

    // Requiring a token by default would break the zero-configuration local flow the tool
    // exists for. Saying nothing would present the exposure as a secure default.
    expect(response.success).toBe(true);
    const message = warn.mock.calls.map((c) => String(c[0])).find((m) => m.includes("auth token"));
    expect(message).toContain("any process on this machine");
    warn.mockRestore();
  });
});

describe("which extensions may connect", () => {
  // `isOriginAllowed` is internal, so this drives the policy through the surface that uses it:
  // a real socket carrying an Origin header.
  function connectWithOrigin(port: number, origin: string): Promise<"open" | "refused"> {
    return new Promise((resolve) => {
      const ws = new WebSocket(`ws://127.0.0.1:${port}`, { origin });
      const done = (r: "open" | "refused") => {
        clearTimeout(timer);
        try {
          ws.close();
        } catch {
          /* already closed */
        }
        resolve(r);
      };
      const timer = setTimeout(() => done("refused"), 2000);
      ws.on("open", () => done("open"));
      ws.on("error", () => done("refused"));
    });
  }

  const PANEL = "chrome-extension://abcdefghijklmnopabcdefghijklmnop";
  const OTHER = "chrome-extension://zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz";

  it("admits any extension when no ids are named", async () => {
    const { port } = await startHub();

    // The default: an unpacked build and a store install have different ids, so assuming one
    // would lock out a developer running the extension they just built.
    expect(await connectWithOrigin(port, OTHER)).toBe("open");
  });

  it("admits only the named extension once ids are given", async () => {
    const hub = new DevtoolsHub({
      port: await getFreePort(),
      allowedExtensionIds: ["abcdefghijklmnopabcdefghijklmnop"],
    });
    await hub.start();
    started.push(hub);
    const port = (hub as unknown as { port: number }).port;

    expect(await connectWithOrigin(port, PANEL)).toBe("open");
    // Every extension shares one origin scheme, so allowing the scheme allowed all of them —
    // any installed extension with a devtools page could open this socket and read the stores.
    expect(await connectWithOrigin(port, OTHER)).toBe("refused");
  });

  it("still refuses a remote page", async () => {
    const hub = new DevtoolsHub({
      port: await getFreePort(),
      allowedExtensionIds: ["abcdefghijklmnopabcdefghijklmnop"],
    });
    await hub.start();
    started.push(hub);
    const port = (hub as unknown as { port: number }).port;

    expect(await connectWithOrigin(port, "https://evil.example")).toBe("refused");
  });
});

describe("history replayed to a newly-connected panel", () => {
  /** Connects as a store, emits one event, and optionally disconnects again. */
  function storeSession(port: number, storeId: string, leave: boolean): Promise<void> {
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(`ws://127.0.0.1:${port}`);
      ws.on("error", reject);
      ws.on("open", () => {
        ws.send(
          JSON.stringify({
            type: "HANDSHAKE_REQUEST",
            protocolVersion: PROTOCOL_VERSION,
            role: DevtoolsRole.STORE,
            store: { id: storeId, name: storeId, capabilities: {} },
          }),
        );
      });
      ws.on("message", (data) => {
        const msg = JSON.parse(String(data)) as { type?: string };
        if (msg.type !== "HANDSHAKE_RESPONSE") return;
        ws.send(
          JSON.stringify({
            type: "STORE_EVENT",
            storeId,
            event: { id: "e1", channel: "c", type: "t", payload: null },
            patches: [],
            snapshotVersion: 1,
            committed: true,
            timestamp: new Date().toISOString(),
            sourceId: storeId,
            sourceRole: DevtoolsRole.STORE,
          }),
        );
        setTimeout(() => {
          if (leave) ws.close();
          resolve();
        }, 50);
      });
    });
  }

  it("replays events for connected stores and skips the departed", async () => {
    const { port } = await startHub();
    await storeSession(port, "gone", true);
    await storeSession(port, "here", false);
    await new Promise((r) => setTimeout(r, 100));

    const seen: Array<Record<string, unknown>> = [];
    const panel = new WebSocket(`ws://127.0.0.1:${port}`);
    await new Promise<void>((resolve, reject) => {
      panel.on("error", reject);
      panel.on("open", () => {
        panel.send(
          JSON.stringify({
            type: "HANDSHAKE_REQUEST",
            protocolVersion: PROTOCOL_VERSION,
            role: DevtoolsRole.EXTENSION,
            extension: { id: "p1", name: "panel", capabilities: {} },
          }),
        );
      });
      panel.on("message", (data) => seen.push(JSON.parse(String(data)) as Record<string, unknown>));
      setTimeout(resolve, 300);
    });
    panel.close();

    const replayed = seen.filter((m) => m.type === "STORE_EVENT").map((m) => m.storeId);
    // A long-lived hub used to greet every new panel with history for stores that had gone —
    // frames it cannot select, sent one at a time, ahead of anything useful.
    expect(replayed).toContain("here");
    expect(replayed).not.toContain("gone");
  });
});

describe("a client that floods the hub", () => {
  it("drops the excess but keeps the connection", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const hub = new DevtoolsHub({ port: await getFreePort(), maxMessagesPerSecond: 5 });
    await hub.start();
    started.push(hub);
    const port = (hub as unknown as { port: number }).port;

    const ws = new WebSocket(`ws://127.0.0.1:${port}`);
    const seen: Array<Record<string, unknown>> = [];
    await new Promise<void>((resolve, reject) => {
      ws.on("error", reject);
      ws.on("message", (d) => seen.push(JSON.parse(String(d)) as Record<string, unknown>));
      ws.on("open", () => {
        // One handshake, then far more traffic than the allowance. `REQUEST_STATE` costs the
        // store a full serialization each time, so a loop on it turns one cheap socket write
        // into repeated work across every connected process.
        ws.send(
          JSON.stringify({
            type: "HANDSHAKE_REQUEST",
            protocolVersion: PROTOCOL_VERSION,
            role: DevtoolsRole.EXTENSION,
            extension: { id: "flooder", name: "flooder", capabilities: {} },
          }),
        );
        for (let i = 0; i < 50; i += 1) {
          ws.send(JSON.stringify({ type: "REQUEST_STATE", storeId: "nobody" }));
        }
        setTimeout(resolve, 250);
      });
    });

    // The handshake still succeeded — the limit throttles, it does not sever, so a panel that
    // briefly bursts recovers on the next window instead of being disconnected.
    expect(seen.some((m) => m.type === "HANDSHAKE_RESPONSE" && m.success === true)).toBe(true);
    expect(warn.mock.calls.some((c) => String(c[0]).includes("messages/second"))).toBe(true);
    ws.close();
    warn.mockRestore();
  });
});
