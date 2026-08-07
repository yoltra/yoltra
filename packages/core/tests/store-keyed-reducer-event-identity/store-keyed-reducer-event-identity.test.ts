import { describe, it, expect } from "vitest";

import { createStore } from "../../src/store/Store";
import type { InstrumentedEvent, ReducerSpec } from "../../src/types";

type EM = {
  ui: {
    rename: { id: string; title: string };
  };
};

type TodosState = { items: Array<{ id: string; title: string }>; seenIds: string[] };
type AuditState = { seenIds: string[] };
type AppState = { todos: TodosState; audit: AuditState };

/**
 * Keyed reducer: targets an exact `[channel, type]`, so it is wired through
 * `reducerBus` in `mountSlice`. This is the path that used to fabricate an id.
 */
const todosSpec: ReducerSpec<TodosState, EM> = {
  state: { items: [{ id: "a", title: "A" }], seenIds: [] },
  when: { keys: [["ui", "rename"]] },
  reducer(state, event) {
    if (event.type !== "rename") return state;
    const { id, title } = event.payload as { id: string; title: string };
    return {
      items: state.items.map((t) => (t.id === id ? { ...t, title } : t)),
      seenIds: [...state.seenIds, event.id],
    };
  },
};

/**
 * Pattern reducer: matched in the emit loop and always received the real event
 * object, so it serves as the control for what the id *should* be.
 */
const auditSpec: ReducerSpec<AuditState, EM> = {
  state: { seenIds: [] },
  when: { any: true },
  reducer(state, event) {
    return { seenIds: [...state.seenIds, event.id] };
  },
};

describe("Store - keyed reducer event identity", () => {
  it("gives keyed reducers the same event id as every other consumer", async () => {
    const store = createStore<AppState, EM>({
      name: "KeyedId",
      reducer: { todos: todosSpec, audit: auditSpec },
    });

    const instrumented: InstrumentedEvent[] = [];
    store.instrument((info) => instrumented.push(info));

    const effectIds: string[] = [];
    store.registerEffect({
      when: { keys: [["ui", "rename"]] },
      effect(event) {
        effectIds.push(event.id);
      },
    });

    const subscriberIds: string[] = [];
    store.onEvent("ui", "rename", (event) => {
      subscriberIds.push(event.id);
    });

    await store.emit("ui", "rename", { id: "a", title: "A2" });

    const state = store.getState();
    const keyedId = state.todos.seenIds[0];
    const patternId = state.audit.seenIds[0];
    const instrumentedId = instrumented[0]!.event.id;

    // The pattern reducer has always seen the true event id — treat it as the oracle.
    expect(typeof patternId).toBe("string");
    expect(instrumentedId).toBe(patternId);
    expect(effectIds).toEqual([patternId]);
    expect(subscriberIds).toEqual([patternId]);

    // Regression: this is what fabricated a fresh crypto.randomUUID() per keyed reducer.
    expect(keyedId).toBe(patternId);

    // And the reduce itself still worked.
    expect(state.todos.items[0]!.title).toBe("A2");
  });

  it("gives every keyed reducer on the same event one identical id", async () => {
    const mirrorSpec: ReducerSpec<AuditState, EM> = {
      state: { seenIds: [] },
      when: { keys: [["ui", "rename"]] },
      reducer(state, event) {
        return { seenIds: [...state.seenIds, event.id] };
      },
    };

    const store = createStore<{ todos: TodosState; mirror: AuditState }, EM>({
      name: "KeyedIdTwice",
      reducer: { todos: todosSpec, mirror: mirrorSpec },
    });

    await store.emit("ui", "rename", { id: "a", title: "A2" });

    const state = store.getState();
    // Two keyed reducers, one emit: previously each minted its own unrelated uuid.
    expect(state.todos.seenIds[0]).toBe(state.mirror.seenIds[0]);
  });

  it("preserves the supplied event id through __replayEvents", () => {
    const store = createStore<AppState, EM>({
      name: "KeyedIdReplay",
      reducer: { todos: todosSpec, audit: auditSpec },
      devtools: { allowReplay: true },
    });

    store.__replayEvents(
      { todos: { items: [{ id: "a", title: "A" }], seenIds: [] }, audit: { seenIds: [] } },
      [{ channel: "ui", type: "rename", payload: { id: "a", title: "A2" }, id: "replayed-id-1" }],
    );

    const state = store.getState();
    // __replayEvents calls reducerBus.emit directly — the second, easily-forgotten
    // call site that also fabricated an id.
    expect(state.audit.seenIds).toEqual(["replayed-id-1"]);
    expect(state.todos.seenIds).toEqual(["replayed-id-1"]);
    expect(state.todos.items[0]!.title).toBe("A2");
  });
});
