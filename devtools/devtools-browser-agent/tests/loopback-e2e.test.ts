import { afterEach, describe, expect, it } from "vitest";

import { createStore, type ReducerSpec } from "@yoltra/core";
import { DevtoolsRole, PROTOCOL_VERSION } from "@yoltra/devtools-protocol";
import { createLoopbackHub } from "@yoltra/devtools-ui";

import { withDevtools } from "../src/withDevtools";

/**
 * Proves the exact data flow of the embeddable demo: the *real* browser agent
 * wired to an in-memory loopback hub, with a mock panel on the other side.
 * No WebSocket server, no ports, no extension — everything in one process.
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

type EM = { ui: { increment: number } };
type AnyMsg = Record<string, any>;

const counterSpec: ReducerSpec<{ value: number }, EM> = {
  state: { value: 0 },
  when: { keys: [["ui", "increment"]] },
  reducer: (s, e) => (e.type === "increment" ? { value: s.value + (e.payload as number) } : s),
};

describe("browser agent over the loopback transport (embedded demo flow)", () => {
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

  it("streams a patch to an embedded panel and applies time-travel back — no sockets", async () => {
    const hub = createLoopbackHub();

    // Real store + real browser agent, but over the injected loopback transport.
    const store = createStore({
      name: "loopback-counter",
      reducer: { counter: counterSpec },
      devtools: { allowReplay: true },
    });
    withDevtools(store, {
      port: 0,
      storeId: "s1",
      allowReplay: true,
      socketFactory: hub.agentSocketFactory,
    });
    cleanups.push(() => store.dispose());

    // Mock panel connected via the loopback WebSocket class.
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

    // Emit -> the real agent streams a STORE_EVENT with a replace patch.
    const before = msgs.length;
    await store.emit("ui", "increment", 5);

    const storeEvent = await waitFor(
      () => msgs.slice(before).find((m) => m.type === "STORE_EVENT" && m.committed),
      { label: "STORE_EVENT at panel" },
    );
    expect(storeEvent.patches).toContainEqual({ op: "replace", path: "/counter/value", value: 5 });

    // Panel -> TIME_TRAVEL -> loopback hub -> real agent applies it to the store.
    panel.send(
      JSON.stringify({
        type: "TIME_TRAVEL",
        storeId: "s1",
        state: { counter: { value: 999 } },
        snapshotVersion: (storeEvent.snapshotVersion ?? 0) + 1,
        timestamp: new Date().toISOString(),
        sourceId: "panel-1",
        sourceRole: DevtoolsRole.EXTENSION,
      }),
    );

    await waitFor(() => store.getState().counter.value === 999, {
      label: "time-travel applied to store",
    });
    expect(store.getState().counter.value).toBe(999);
  });
});

describe("state JSON cannot carry, over the same flow", () => {
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

  type RichEM = { ui: { seed: null } };
  type RichState = { index: Map<string, number>; when: Date; big: bigint };

  const richSpec: ReducerSpec<RichState, RichEM> = {
    state: { index: new Map([["a", 1]]), when: new Date(0), big: 10n },
    when: { keys: [["ui", "seed"]] },
    reducer: (s, e) =>
      e.type === "seed" ? { ...s, index: new Map([...s.index, ["b", 2]]) } : s,
  };

  it("survives a snapshot and time-travel without corrupting the live store", async () => {
    const hub = createLoopbackHub();
    const store = createStore<{ rich: RichState }, RichEM>({
      name: "rich",
      reducer: { rich: richSpec },
      devtools: { allowReplay: true },
    });
    withDevtools(store as never, {
      port: 0,
      storeId: "s1",
      allowReplay: true,
      socketFactory: hub.agentSocketFactory,
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
    await waitFor(() => msgs.some((m) => m.type === "STORE_CONNECTED" || m.type === "STORE_REGISTRY"), {
      label: "store visible",
    });

    // The snapshot must survive the trip. `JSON.stringify` would have thrown on the BigInt from
    // inside an unawaited handler, so no snapshot ever arrived and the panel retried forever.
    const before = msgs.length;
    panel.send(
      JSON.stringify({
        type: "REQUEST_STATE",
        storeId: "s1",
        timestamp: new Date().toISOString(),
        sourceId: "panel-1",
        sourceRole: DevtoolsRole.EXTENSION,
      }),
    );
    const snapshot = await waitFor(
      () => msgs.slice(before).find((m) => m.type === "STATE_SNAPSHOT"),
      { label: "snapshot despite BigInt" },
    );

    // Send exactly what the panel received straight back, which is what time-travel does.
    panel.send(
      JSON.stringify({
        type: "TIME_TRAVEL",
        storeId: "s1",
        state: snapshot.state,
        snapshotVersion: (snapshot.version ?? 0) + 1,
        timestamp: new Date().toISOString(),
        sourceId: "panel-1",
        sourceRole: DevtoolsRole.EXTENSION,
      }),
    );
    await tick();
    await tick();

    // The regression this exists for: the Map used to arrive as `{}` and be written back over
    // the live one, so a debugging tool silently emptied a collection in the running program.
    const after = store.getState().rich;
    expect(after.index).toBeInstanceOf(Map);
    expect(after.index.get("a")).toBe(1);
    expect(after.when).toBeInstanceOf(Date);
    expect(after.big).toBe(10n);
  });
});

describe("a state too large for the transport", () => {
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

  type BigEM = { ui: { noop: null } };
  type BigState = { rows: Array<{ id: number; label: string }> };

  const bigSpec: ReducerSpec<BigState, BigEM> = {
    state: { rows: Array.from({ length: 5000 }, (_, i) => ({ id: i, label: `row ${i}` })) },
    when: { keys: [["ui", "noop"]] },
    reducer: (s) => s,
  };

  it("answers with a shortened snapshot that says it was shortened", async () => {
    const hub = createLoopbackHub();
    const store = createStore<{ big: BigState }, BigEM>({ name: "big", reducer: { big: bigSpec } });
    withDevtools(store as never, {
      port: 0,
      storeId: "s1",
      socketFactory: hub.agentSocketFactory,
      // Far below any real cap, so the bound is reached with a state small enough to build fast.
      maxSnapshotBytes: 2_000,
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
    await waitFor(() => msgs.some((m) => m.type === "STORE_CONNECTED" || m.type === "STORE_REGISTRY"));

    const before = msgs.length;
    panel.send(
      JSON.stringify({
        type: "REQUEST_STATE",
        storeId: "s1",
        timestamp: new Date().toISOString(),
        sourceId: "panel-1",
        sourceRole: DevtoolsRole.EXTENSION,
      }),
    );

    const snapshot = await waitFor(
      () => msgs.slice(before).find((m) => m.type === "STATE_SNAPSHOT"),
      { label: "snapshot arrives despite the size" },
    );

    // A snapshot arrives at all, which is the point: an oversized frame is refused by the hub
    // and takes the connection with it, so the panel would otherwise reconnect, ask again, and
    // wait through the loop with nothing to show for it.
    expect(JSON.stringify(snapshot.state).length).toBeLessThanOrEqual(2_000);
    // And it admits to being partial rather than presenting itself as the state.
    expect(snapshot.truncated).toBe(true);
    expect(String(snapshot.truncationNote ?? "")).not.toBe("");
  });
});

describe("the panel's subscription list stays current", () => {
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

  it("pushes STORE_SUBSCRIPTIONS when something is registered at runtime", async () => {
    // `__devtoolsIntrospect()` is a pull, so until the agent subscribed to registration
    // changes the panel's list went stale the moment anything mounted: a decoration adding a
    // slice, a hot reload, an `onEvent` from a component. The panel had no way to know and
    // no reason to ask again.
    const hub = createLoopbackHub();
    const store = createStore({
      name: "subscriptions-push",
      reducer: { counter: counterSpec },
    });
    withDevtools(store, {
      port: 0,
      storeId: "s-push",
      socketFactory: hub.agentSocketFactory,
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
        extension: { id: "panel-push", name: "Embedded Panel", capabilities: {} },
      }),
    );
    await waitFor(
      () =>
        msgs.some(
          (m) =>
            (m.type === "STORE_CONNECTED" && m.store?.id === "s-push") ||
            (m.type === "STORE_REGISTRY" && m.stores?.some((st: AnyMsg) => st.id === "s-push")),
        ),
      { label: "store visible to panel" },
    );

    const before = msgs.filter((m) => m.type === "STORE_SUBSCRIPTIONS").length;

    // Nobody asked. The agent should volunteer it.
    store.registerSlice("late", {
      state: { n: 0 },
      when: { keys: [["ui", "increment"]] },
      reducer: (s: { n: number }) => s,
    } as ReducerSpec<any, EM>);

    const pushed = await waitFor(
      () => {
        const frames = msgs.filter((m) => m.type === "STORE_SUBSCRIPTIONS");
        return frames.length > before ? frames[frames.length - 1] : undefined;
      },
      { label: "pushed STORE_SUBSCRIPTIONS" },
    );

    // And it carries the new slice, with the provenance a panel needs to attribute it.
    const late = (pushed.reducers as AnyMsg[]).find((r) => r.name === "late");
    expect(late).toBeDefined();
    expect(late?.origin).toBe("dynamic");
  });

  it("does not push a snapshot for the store's own internal registrations", async () => {
    // `store.call()` mounts and unmounts a reply listener per call. Forwarding those turned
    // ordinary request/response traffic into two whole-store snapshots per call, which is a
    // lot of hub bandwidth to describe something the panel does not display.
    const hub = createLoopbackHub();
    const store = createStore({
      name: "internal-quiet",
      reducer: { counter: counterSpec },
    });
    withDevtools(store as never, {
      port: 0,
      storeId: "s-quiet",
      socketFactory: hub.agentSocketFactory,
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
        extension: { id: "panel-quiet", name: "Embedded Panel", capabilities: {} },
      }),
    );
    await waitFor(
      () =>
        msgs.some(
          (m) =>
            (m.type === "STORE_CONNECTED" && m.store?.id === "s-quiet") ||
            (m.type === "STORE_REGISTRY" && m.stores?.some((st: AnyMsg) => st.id === "s-quiet")),
        ),
      { label: "store visible to panel" },
    );

    const before = msgs.filter((m) => m.type === "STORE_SUBSCRIPTIONS").length;

    (store as never as { registerEffect: (s: unknown) => void }).registerEffect({
      when: { keys: [["rpc", "ask"]] },
      effect: async (_e: unknown, _g: unknown, emit: any) => {
        await emit("rpc", "answer", { ok: true });
      },
    });
    // One push for the effect above, which is a `dynamic` registration and should be seen.
    await waitFor(
      () => msgs.filter((m) => m.type === "STORE_SUBSCRIPTIONS").length > before,
      { label: "push for the dynamic effect" },
    );
    const afterDynamic = msgs.filter((m) => m.type === "STORE_SUBSCRIPTIONS").length;

    await (store as never as { call: (...a: unknown[]) => Promise<unknown> }).call(
      "rpc",
      "ask",
      {},
      { reply: ["rpc", "answer"] },
    );
    await tick();
    await tick();

    // The call mounted and unmounted a reply listener. Neither should have reached the hub.
    expect(msgs.filter((m) => m.type === "STORE_SUBSCRIPTIONS").length).toBe(afterDynamic);
  });

  it("truncates an oversized event payload instead of killing the socket", async () => {
    // Snapshots have always been bounded; event payloads were not. The hub caps a frame at
    // 8 MiB and `ws` answers an oversized one by *closing the connection*, not by dropping
    // the message, so a single large emit ended the session. Faithful binary encoding makes
    // this reachable in ordinary use: an ArrayBuffer now carries its bytes rather than
    // serializing to `{}`.
    const hub = createLoopbackHub();
    const store = createStore({
      name: "big-payload",
      reducer: { counter: counterSpec },
    });
    withDevtools(store as never, {
      port: 0,
      storeId: "s-big",
      socketFactory: hub.agentSocketFactory,
      maxEventBytes: 2_048,
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
        extension: { id: "panel-big", name: "Embedded Panel", capabilities: {} },
      }),
    );
    await waitFor(
      () =>
        msgs.some(
          (m) =>
            (m.type === "STORE_CONNECTED" && m.store?.id === "s-big") ||
            (m.type === "STORE_REGISTRY" && m.stores?.some((st: AnyMsg) => st.id === "s-big")),
        ),
      { label: "store visible to panel" },
    );

    await (store as never as { emit: (...a: unknown[]) => Promise<unknown> }).emit(
      "ui",
      "increment",
      "x".repeat(100_000),
    );

    const evt = await waitFor(
      () => msgs.find((m) => m.type === "STORE_EVENT"),
      { label: "STORE_EVENT at panel" },
    );

    expect(evt.event.truncated).toBe(true);
    // The frame arrived, and is nowhere near the cap that would have closed the socket.
    expect(JSON.stringify(evt).length).toBeLessThan(10_000);
  });
});
