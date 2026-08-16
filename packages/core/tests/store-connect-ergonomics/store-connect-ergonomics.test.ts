import { describe, it, expect } from "vitest";

import { createStore } from "../../src/store/Store";
import type { Change } from "../../src/types";

type EM = { ui: { rename: string; touch: null } };
type State = { title: string; nested: { count: number } };

function store() {
  return createStore<{ page: State }, EM>({
    name: "ergonomics",
    reducer: {
      page: {
        state: { title: "first", nested: { count: 0 } },
        when: { keys: [["ui", "rename"]] },
        reducer: (s, e) => ({ ...s, title: e.payload as string }),
      },
    },
  });
}

describe("connect({ immediate: true })", () => {
  it("delivers the current value before any change happens", () => {
    const seen: Change[] = [];

    store().connect({ reducer: "page", property: "title" }, (c) => seen.push(c), {
      immediate: true,
    });

    // Without this a subscriber's first render has to read the same path separately — the path
    // spelled twice, in two places that can drift.
    expect(seen).toEqual([{ oldValue: undefined, newValue: "first", path: "title" }]);
  });

  it("claims no cause, because nothing caused it", () => {
    const seen: Change[] = [];
    store().connect({ reducer: "page", property: "title" }, (c) => seen.push(c), {
      immediate: true,
    });

    // Inventing an eventId here would be a lie a subscriber could act on.
    expect(seen[0]!.eventId).toBeUndefined();
    expect(seen[0]!.channel).toBeUndefined();
  });

  it("delivers the slice root for a pattern, which has no single current value", () => {
    const seen: Change[] = [];
    store().connect({ reducer: "page", property: "nested.**" }, (c) => seen.push(c), {
      immediate: true,
    });

    expect(seen[0]!.path).toBe("");
    expect(seen[0]!.newValue).toEqual({ title: "first", nested: { count: 0 } });
  });

  it("is off unless asked for, and does not disturb later changes", async () => {
    const s = store();
    const withOut: Change[] = [];
    const withIn: Change[] = [];

    s.connect({ reducer: "page", property: "title" }, (c) => withOut.push(c));
    s.connect({ reducer: "page", property: "title" }, (c) => withIn.push(c), { immediate: true });

    await s.emit("ui", "rename", "second");

    expect(withOut).toHaveLength(1); // the change only
    expect(withIn).toHaveLength(2); // the current value, then the change
    expect(withOut[0]!.newValue).toBe("second");
    expect(withIn[1]!.newValue).toBe("second");
  });
});

describe("Change provenance", () => {
  it("names the event that caused the change", async () => {
    const s = store();
    const seen: Change[] = [];
    s.connect({ reducer: "page", property: "title" }, (c) => seen.push(c));

    await s.emit("ui", "rename", "second", { id: "evt-1" });

    // Previously anonymous, so a subscriber needing the cause had to mirror it into state and
    // keep it in two places.
    expect(seen[0]).toMatchObject({
      oldValue: "first",
      newValue: "second",
      path: "title",
      eventId: "evt-1",
      channel: "ui",
      type: "rename",
    });
  });

  it("omits provenance for a change that no event caused", () => {
    const s = createStore<{ page: State }, EM>({
      name: "time-travel",
      reducer: {
        page: {
          state: { title: "first", nested: { count: 0 } },
          when: { keys: [["ui", "rename"]] },
          reducer: (state) => state,
        },
      },
      devtools: { allowReplay: true },
    });
    const seen: Change[] = [];
    s.connect({ reducer: "page", property: "title" }, (c) => seen.push(c));

    s.__applyExternalState({ page: { title: "from a snapshot", nested: { count: 0 } } });

    // A time-travel jump has no causing event. Absence is the honest signal, and is what tells a
    // subscriber this did not come from the event stream.
    expect(seen[0]!.newValue).toBe("from a snapshot");
    expect(seen[0]!.eventId).toBeUndefined();
    expect(seen[0]!.channel).toBeUndefined();
    expect(seen[0]!.type).toBeUndefined();
  });
});
