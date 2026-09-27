import { createServer } from "node:net";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { WebSocket } from "ws";

import { createStore, type ReducerSpec } from "@yoltra/core";
import { DevtoolsRole, PROTOCOL_VERSION } from "@yoltra/devtools-protocol";
import { DevtoolsHub } from "@yoltra/devtools-server";

import { withNodetools } from "../src/withNodetools";

/**
 * The per-event byte cap, over the real wire.
 *
 * @remarks
 * Snapshots were bounded long before events were, and the gap was not academic: the hub refuses
 * a frame past its 8 MiB limit by closing the socket rather than dropping the message, so a
 * single oversized emit ended the session. Faithful binary encoding made it reachable in
 * ordinary use, because an `ArrayBuffer` now carries its bytes instead of serializing to `{}`.
 *
 * What matters is that the agent says so. A truncated payload that arrives unflagged is worse
 * than one that never arrives, because the panel renders it as though it were the whole value.
 * So these assert the flags, not just the survival of the connection.
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

type EM = { doc: { write: { data: string } } };
type DocState = { blob: string };

const docSpec: ReducerSpec<DocState, EM> = {
  state: { blob: "" },
  when: { keys: [["doc", "write"]] },
  reducer: (s, e) => (e.type === "write" ? { ...s, blob: (e.payload as { data: string }).data } : s),
};

/** Small enough that the default cap is irrelevant and the configured one does the work. */
const MAX_EVENT_BYTES = 2048;

describe("the per-event byte cap, over real sockets", () => {
  const cleanups: Array<() => void | Promise<void>> = [];

  // The hub warns on startup that it is running without an auth token, which is the right
  // thing for it to do and deliberate here. Capturing it keeps `rush test`, which fails on any
  // stderr, honest about real warnings.
  beforeEach(() => {
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
  });

  afterEach(async () => {
    for (const c of cleanups.splice(0).reverse()) {
      try {
        await c();
      } catch {
        /* best-effort teardown */
      }
    }
    vi.restoreAllMocks();
  });

  /** Brings up a hub, an instrumented store and a subscribed extension. */
  async function harness(storeId: string) {
    const port = await getFreePort();
    const hub = new DevtoolsHub({ port });
    await hub.start();
    cleanups.push(() => hub.stop());

    const store = createStore<{ doc: DocState }, EM>({
      name: "doc",
      reducer: { doc: docSpec },
    });
    withNodetools(store, { port, storeId, maxEventBytes: MAX_EVENT_BYTES });
    cleanups.push(() => store.dispose());

    const ext = connectExtension(port);
    cleanups.push(() => ext.ws.close());
    await ext.opened;
    ext.ws.send(
      JSON.stringify({
        type: "HANDSHAKE_REQUEST",
        protocolVersion: PROTOCOL_VERSION,
        role: DevtoolsRole.EXTENSION,
        extension: { id: `ext-${storeId}`, name: "Bounds Extension", capabilities: {} },
      }),
    );
    await waitFor(
      () =>
        ext.messages.some(
          (m) =>
            (m.type === "STORE_CONNECTED" && m.store?.id === storeId) ||
            (m.type === "STORE_REGISTRY" && m.stores?.some((s: AnyMsg) => s.id === storeId)),
        ),
      { label: "store visible to extension" },
    );
    return { store, ext };
  }

  it("forwards a payload under the cap whole, and flags nothing", async () => {
    const { store, ext } = await harness("s-bounds-small");

    const before = ext.messages.length;
    await store.emit("doc", "write", { data: "short" });
    const event = await waitFor(
      () => ext.messages.slice(before).find((m) => m.type === "STORE_EVENT" && m.committed),
      { label: "event at extension" },
    );

    expect(event.event.payload).toEqual({ data: "short" });
    // Absent rather than false: the flag is only added when it is true, so a panel can treat
    // its presence as the signal.
    expect(event.event.truncated).toBeUndefined();
    expect(event.patchesTruncated).toBeUndefined();
    expect(event.patches).toContainEqual({ op: "replace", path: "/doc/blob", value: "short" });
  });

  it("flags an oversized payload and the patch that carries it, rather than closing the socket", async () => {
    const { store, ext } = await harness("s-bounds-large");

    // One enormous string rather than many small values, which is the case no node budget can
    // reduce: the encoder gives up and says so instead of emitting a frame the hub would refuse.
    const data = "x".repeat(MAX_EVENT_BYTES * 4);

    const before = ext.messages.length;
    await store.emit("doc", "write", { data });
    const event = await waitFor(
      () => ext.messages.slice(before).find((m) => m.type === "STORE_EVENT" && m.committed),
      { label: "event at extension" },
    );

    expect(event.event.truncated).toBe(true);
    expect(event.event.payload).toEqual({ $yoltra: "unsupported", kind: "truncated" });

    // The same value reaches state, so the patch is over the cap too and is flagged separately.
    expect(event.patchesTruncated).toBe(true);
    expect(event.patches).toContainEqual({
      op: "replace",
      path: "/doc/blob",
      value: { $yoltra: "unsupported", kind: "truncated" },
    });

    // The point of bounding: the session survives, and the store is untouched by any of it.
    expect(store.getState().doc.blob).toBe(data);
    expect(ext.ws.readyState).toBe(WebSocket.OPEN);
  });
});
