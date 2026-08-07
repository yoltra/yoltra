import { describe, it, expect } from "vitest";

import { createStore } from "../../src/store/Store";
import type {
  EventMeta,
  InstrumentedEvent,
  MiddlewareFunction,
  ReducerSpec,
} from "../../src/types";

type EM = {
  ui: {
    rename: { id: string; title: string };
    blocked: null;
  };
};

type TodosState = { title: string; seenMeta: Array<EventMeta | undefined> };
type AuditState = { seenMeta: Array<EventMeta | undefined> };
type AppState = { todos: TodosState; audit: AuditState };

/** Keyed reducer — reached through `reducerBus`. */
const todosSpec: ReducerSpec<TodosState, EM> = {
  state: { title: "A", seenMeta: [] },
  when: { keys: [["ui", "rename"]] },
  reducer(state, event) {
    if (event.type !== "rename") return state;
    const { title } = event.payload as { id: string; title: string };
    return { title, seenMeta: [...state.seenMeta, event.meta] };
  },
};

/** Pattern reducer — reached directly from the emit loop. */
const auditSpec: ReducerSpec<AuditState, EM> = {
  state: { seenMeta: [] },
  when: { any: true },
  reducer(state, event) {
    return { seenMeta: [...state.seenMeta, event.meta] };
  },
};

const META: EventMeta = { trace: { origin: "checkout-service", hop: 1 } };

describe("Store - event meta", () => {
  it("carries meta to every consumer, by reference", async () => {
    const store = createStore<AppState, EM>({
      name: "Meta",
      reducer: { todos: todosSpec, audit: auditSpec },
    });

    const middlewareMeta: Array<EventMeta | undefined> = [];
    store.registerMiddleware(((_state, event) => {
      middlewareMeta.push(event.meta);
      return true;
    }) as MiddlewareFunction<any, EM>);

    const effectMeta: Array<EventMeta | undefined> = [];
    store.registerEffect({
      when: { keys: [["ui", "rename"]] },
      effect(event) {
        effectMeta.push(event.meta);
      },
    });

    const subscriberMeta: Array<EventMeta | undefined> = [];
    store.onEvent("ui", "rename", (event) => {
      subscriberMeta.push(event.meta);
    });

    const instrumented: InstrumentedEvent[] = [];
    store.instrument((info) => instrumented.push(info));

    await store.emit("ui", "rename", { id: "a", title: "A2" }, { meta: META });

    const state = store.getState();
    expect(state.todos.seenMeta).toEqual([META]);
    expect(state.audit.seenMeta).toEqual([META]);
    expect(middlewareMeta).toEqual([META]);
    expect(effectMeta).toEqual([META]);
    expect(subscriberMeta).toEqual([META]);
    expect(instrumented[0]!.event.meta).toBe(META);
  });

  it("reaches uncommitted subscribers and instrumentation when middleware vetoes", async () => {
    const store = createStore<AppState, EM>({
      name: "MetaVeto",
      reducer: { todos: todosSpec, audit: auditSpec },
      middleware: [((_state, event) => event.type !== "blocked") as MiddlewareFunction<any, EM>],
    });

    const uncommittedMeta: Array<EventMeta | undefined> = [];
    store.onEvent("ui", "blocked", (event) => {
      uncommittedMeta.push(event.meta);
    }, "uncommitted");

    const instrumented: InstrumentedEvent[] = [];
    store.instrument((info) => instrumented.push(info));

    await store.emit("ui", "blocked", null, { meta: META });

    expect(uncommittedMeta).toEqual([META]);
    expect(instrumented[0]!.committed).toBe(false);
    expect(instrumented[0]!.event.meta).toBe(META);
  });

  it("omits the property entirely when no meta is supplied", async () => {
    const store = createStore<AppState, EM>({
      name: "MetaAbsent",
      reducer: { todos: todosSpec, audit: auditSpec },
    });

    const seen: InstrumentedEvent[] = [];
    store.instrument((info) => seen.push(info));

    const subscriberEvents: unknown[] = [];
    store.onEvent("ui", "rename", (event) => {
      subscriberEvents.push(event);
    });

    await store.emit("ui", "rename", { id: "a", title: "A2" });

    // Absent, not `undefined` — the event object stays byte-identical to the pre-meta shape.
    expect(seen[0]!.event).toStrictEqual({
      id: seen[0]!.event.id,
      channel: "ui",
      type: "rename",
      payload: { id: "a", title: "A2" },
    });
    expect("meta" in (seen[0]!.event as object)).toBe(false);
    expect("meta" in (subscriberEvents[0] as object)).toBe(false);
    expect(store.getState().audit.seenMeta).toEqual([undefined]);
  });

  it("is not part of the dedup fingerprint", async () => {
    const store = createStore<AppState, EM>({
      name: "MetaDedup",
      reducer: { todos: todosSpec, audit: auditSpec },
      dedupWindowMs: 1000,
    });

    await store.emit("ui", "rename", { id: "a", title: "A2" }, { meta: { origin: "one" } });
    await store.emit("ui", "rename", { id: "a", title: "A2" }, { meta: { origin: "two" } });

    // Same (channel, type, payload) — differing meta must not defeat dedup.
    expect(store.getState().audit.seenMeta).toEqual([{ origin: "one" }]);
  });

  it("carries meta through __replayEvents", () => {
    const store = createStore<AppState, EM>({
      name: "MetaReplay",
      reducer: { todos: todosSpec, audit: auditSpec },
      devtools: { allowReplay: true },
    });

    store.__replayEvents({ todos: { title: "A", seenMeta: [] }, audit: { seenMeta: [] } }, [
      {
        channel: "ui",
        type: "rename",
        payload: { id: "a", title: "A2" },
        id: "replay-1",
        meta: META,
      },
    ]);

    const state = store.getState();
    expect(state.todos.seenMeta).toEqual([META]);
    expect(state.audit.seenMeta).toEqual([META]);
  });
});
