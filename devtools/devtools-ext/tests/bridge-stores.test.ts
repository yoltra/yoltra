import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { MockInstance } from "vitest";

import { createStore, type ReducerSpec } from "@yoltra/core";
import { createPostMessageSocketFactory, withDevtools } from "@yoltra/devtools-browser-agent";
import { DevtoolsRole, PROTOCOL_VERSION, duplicateStoreIdError } from "@yoltra/devtools-protocol";
import { createLoopbackHub } from "@yoltra/devtools-ui";

import { bridgePage, type BridgePort } from "../src/bridge";

/**
 * Several stores in one page, inspected through the bridge.
 *
 * The whole path runs here: real agents posting into a page window, the real content script
 * relaying that window to a runtime port, a port pair standing in for the service worker (which
 * copies messages across unread), and the panel's half of the bridge attaching the page to the
 * in-panel broker. A mock panel connects to the broker as the UI does.
 *
 * Over a hub, each store has its own socket. Through the bridge the page had one: every store's
 * frames reached the broker as a single peer, so the second store's handshake arrived on a peer
 * already registered as the first store and was never treated as a handshake.
 */

type EM = { ui: { increment: number } };
type AnyMsg = Record<string, any>;

const counterSpec: ReducerSpec<{ value: number }, EM> = {
  state: { value: 0 },
  when: { keys: [["ui", "increment"]] },
  reducer: (s, e) => (e.type === "increment" ? { value: s.value + (e.payload as number) } : s),
};

async function waitFor<T>(fn: () => T | undefined | false, label: string): Promise<T> {
  const start = Date.now();
  for (;;) {
    const v = fn();
    if (v !== undefined && v !== false) return v as T;
    if (Date.now() - start > 2000) throw new Error(`timed out waiting for ${label}`);
    await new Promise((r) => setTimeout(r, 10));
  }
}

const settle = () => new Promise((r) => setTimeout(r, 50));

/** A page window: `postMessage` is delivered to every listener on a later task, as in a browser. */
function pageWindow() {
  const listeners = new Set<(event: MessageEvent) => void>();
  const win = {
    postMessage: (data: unknown) => {
      setTimeout(() => {
        for (const l of [...listeners]) l({ source: win, data } as unknown as MessageEvent);
      }, 0);
    },
    addEventListener: (_type: string, l: (event: MessageEvent) => void) => void listeners.add(l),
    removeEventListener: (_type: string, l: (event: MessageEvent) => void) =>
      void listeners.delete(l),
  };
  return win;
}

/** Two ends of a runtime port, the service worker's pairing reduced to a copy. */
function portPair() {
  const make = () => {
    const onMessage: Array<(m: unknown) => void> = [];
    const onDisconnect: Array<() => void> = [];
    return {
      onMessage: { addListener: (l: (m: unknown) => void) => void onMessage.push(l) },
      onDisconnect: { addListener: (l: () => void) => void onDisconnect.push(l) },
      postMessage: (_m: unknown) => undefined as void,
      receive: (m: unknown) => onMessage.forEach((l) => l(m)),
      drop: () => onDisconnect.forEach((l) => l()),
    };
  };
  const page = make();
  const panel = make();
  page.postMessage = (m) => panel.receive(structuredClone(m));
  panel.postMessage = (m) => page.receive(structuredClone(m));
  return { page, panel };
}

const cleanups: Array<() => void> = [];
let error: MockInstance<typeof console.error>;

beforeEach(() => {
  vi.spyOn(console, "warn").mockImplementation(() => undefined);
  error = vi.spyOn(console, "error").mockImplementation(() => undefined);
});

afterEach(() => {
  for (const c of cleanups.splice(0).reverse()) {
    try {
      c();
    } catch {
      /* best-effort */
    }
  }
  vi.restoreAllMocks();
});

/** Builds the page, its relay, the broker and a mock panel, all joined through the bridge. */
async function inspectedPage() {
  const win = pageWindow();
  const ports = portPair();

  // The content script runs against the page's globals.
  const g = globalThis as unknown as Record<string, unknown>;
  const head = { appendChild: () => undefined };
  g.window = win;
  g.document = {
    createElement: () => ({ textContent: "", remove: () => undefined }),
    head,
    documentElement: head,
  };
  g.chrome = { runtime: { connect: () => ports.page } };
  vi.resetModules();
  await import("../src/content-script");

  const hub = createLoopbackHub();
  bridgePage(hub, ports.panel as unknown as BridgePort);

  const panel = new hub.WebSocket("loopback://panel");
  const seen: AnyMsg[] = [];
  (panel as unknown as { onmessage: (ev: { data: string }) => void }).onmessage = (ev) =>
    seen.push(JSON.parse(ev.data));
  cleanups.push(() => panel.close());
  await settle();
  panel.send(
    JSON.stringify({
      type: "HANDSHAKE_REQUEST",
      protocolVersion: PROTOCOL_VERSION,
      role: DevtoolsRole.EXTENSION,
      extension: { id: "panel-1", name: "Panel", capabilities: {} },
    }),
  );

  const attach = (name: string, storeId?: string) => {
    const store = createStore({
      name,
      reducer: { counter: counterSpec },
      devtools: { allowReplay: true },
    });
    withDevtools(store, {
      port: 0,
      ...(storeId !== undefined ? { storeId } : {}),
      allowReplay: true,
      autoReconnect: false,
      socketFactory: createPostMessageSocketFactory(win),
    });
    cleanups.push(() => store.dispose());
    return store;
  };

  const command = (type: string, storeId: string, extra: AnyMsg = {}) =>
    panel.send(
      JSON.stringify({
        type,
        storeId,
        timestamp: new Date().toISOString(),
        sourceId: "panel-1",
        sourceRole: DevtoolsRole.EXTENSION,
        ...extra,
      }),
    );

  /** Ids the panel has been told are connected, from the registry and later announcements. */
  const known = () => {
    const ids = new Set<string>();
    for (const m of seen) {
      if (m.type === "STORE_REGISTRY") for (const s of m.stores) ids.add(s.id);
      if (m.type === "STORE_CONNECTED") ids.add(m.store.id);
      if (m.type === "STORE_DISCONNECTED") ids.delete(m.storeId);
    }
    return [...ids].sort();
  };

  return { seen, attach, command, known, ports };
}

describe("two stores in one page, through the bridge", () => {
  it("registers each store under its own id", async () => {
    const page = await inspectedPage();
    page.attach("Cart");
    page.attach("Profile");

    await waitFor(() => page.known().length === 2, "both stores to be announced");
    expect(page.known()).toEqual(["Cart", "Profile"]);
  });

  it("routes each store's events, and commands to the store they name", async () => {
    const page = await inspectedPage();
    const cart = page.attach("Cart");
    const profile = page.attach("Profile");
    await waitFor(() => page.known().length === 2, "both stores to be announced");

    await profile.emit("ui", "increment", 7);
    const event = await waitFor(
      () => page.seen.find((m) => m.type === "STORE_EVENT" && m.committed),
      "a store event",
    );
    expect(event.storeId).toBe("Profile");

    const before = page.seen.length;
    page.command("REQUEST_STATE", "Cart");
    await waitFor(
      () => page.seen.slice(before).some((m) => m.type === "STATE_SNAPSHOT"),
      "a snapshot",
    );
    await settle();
    const snapshots = page.seen.slice(before).filter((m) => m.type === "STATE_SNAPSHOT");
    expect(snapshots.map((m) => m.storeId)).toEqual(["Cart"]);

    page.command("TIME_TRAVEL", "Cart", { state: { counter: { value: 99 } }, snapshotVersion: 1 });
    await waitFor(() => cart.getState().counter.value === 99, "time travel on the named store");
    await settle();
    expect(profile.getState().counter.value).toBe(7);
  });

  it("refuses a second store with the same id, with the hub's message", async () => {
    const page = await inspectedPage();
    page.attach("Cart");
    await waitFor(() => page.known().length === 1, "the first store");
    page.attach("Cart");

    await waitFor(() => error.mock.calls.length > 0, "the refused handshake");
    expect(error.mock.calls[0]?.[1]).toBe(duplicateStoreIdError("Cart"));
    await settle();
    expect(page.known()).toEqual(["Cart"]);
  });

  it("announces a store that is disposed as gone, and admits its id again", async () => {
    const page = await inspectedPage();
    const first = page.attach("Cart");
    await waitFor(() => page.known().length === 1, "the first store");

    first.dispose();
    await waitFor(() => page.known().length === 0, "the store to be announced gone");

    // Re-wrapping after a reload of the module, as hot replacement does, reuses the id.
    page.attach("Cart");
    await waitFor(() => page.known().length === 1, "the id to be admitted again");
    expect(error).not.toHaveBeenCalled();
  });

  it("announces every store as gone when the page goes away", async () => {
    const page = await inspectedPage();
    page.attach("Cart");
    page.attach("Profile");
    await waitFor(() => page.known().length === 2, "both stores to be announced");

    page.ports.panel.drop();
    await waitFor(() => page.known().length === 0, "both stores to be announced gone");
  });
});
