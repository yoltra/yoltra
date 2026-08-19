import { describe, it, expect, vi } from "vitest";

import { createStore } from "../../src/store/Store";
import { Rejected, isRejected } from "../../src/store/rejection";
import type { Rejection } from "../../src/store/rejection";

/**
 * Two guarantees live here, and they are the same restructure seen from two sides.
 *
 * A commit is **atomic across slices**: every staged slice is written before anybody is told
 * anything. Notifications used to fire per slice as each one committed, so a subscriber to slice
 * A could read `getState()` and see slice B of the *same event* not yet applied — a real window,
 * and the reason React's atomic hooks could compute from half an event.
 *
 * And a reducer can **refuse**, which discards the whole event. That is only expressible because
 * of the above: an event cannot be un-notified.
 */

type EM = {
  plan: { patch: { steps?: number; note?: string; expected?: number } };
  app: { touch: null };
};

type PlanState = { steps: number; version: number };
type AuditState = { entries: number };

function build(opts: Parameters<typeof createStore<{ plan: PlanState; audit: AuditState }, EM>>[0]) {
  return createStore<{ plan: PlanState; audit: AuditState }, EM>(opts);
}

/** A plan slice that refuses a stale compare-and-swap, and an audit slice that records blindly. */
function contendedStore(onRejected?: (r: Rejection, e: unknown, slice: string) => void) {
  return build({
    name: "contended",
    reducer: {
      plan: {
        state: { steps: 0, version: 1 },
        when: { keys: [["plan", "patch"]] },
        reducer: (state, event) => {
          const { expected, steps } = event.payload as { expected?: number; steps?: number };
          if (expected !== undefined && expected !== state.version) {
            return Rejected(`stale write: expected v${expected}, have v${state.version}`);
          }
          return { steps: steps ?? state.steps, version: state.version + 1 };
        },
      },
      audit: {
        state: { entries: 0 },
        when: { keys: [["plan", "patch"]] },
        reducer: (state) => ({ entries: state.entries + 1 }),
      },
    },
    ...(onRejected !== undefined ? { onRejected: onRejected as never } : {}),
  });
}

describe("a commit is atomic across slices", () => {
  it("shows every slice of an event applied, to the first subscriber notified", async () => {
    const store = contendedStore();
    const observed: Array<{ steps: number; entries: number }> = [];

    // Subscribing to `plan` and reading `audit` from the handler is the exact shape that used to
    // tear: `plan` committed and notified while `audit` had not yet reduced.
    store.connect({ reducer: "plan", property: "steps" }, () => {
      const s = store.getState();
      observed.push({ steps: s.plan.steps, entries: s.audit.entries });
    });

    await store.emit("plan", "patch", { steps: 7 });

    expect(observed).toEqual([{ steps: 7, entries: 1 }]);
  });

  it("gives the whole event one new state reference, not one per slice", async () => {
    const store = contendedStore();
    const roots: unknown[] = [];
    store.subscribe(() => roots.push(store.getState()));

    await store.emit("plan", "patch", { steps: 1 });

    // Two slices changed; the coarse listener fires once, against one root.
    expect(roots).toHaveLength(1);
  });
});

describe("a reducer can refuse the whole event", () => {
  it("writes nothing at all when one slice refuses", async () => {
    const store = contendedStore();
    await store.emit("plan", "patch", { steps: 5 }); // version 1 → 2, audit 1

    const before = store.getState();
    const result = await store.emit("plan", "patch", { steps: 99, expected: 1 });

    // The refusal is the point, but so is `audit`: a sibling that would happily have recorded
    // the write must not, or state claims an event happened that did not.
    expect(result.written).toBe(false);
    expect(result.rejected?.reason).toMatch(/stale write/);
    expect(store.getState()).toBe(before);
    expect(store.getState().audit.entries).toBe(1);
  });

  it("fires no change notification for a refused event", async () => {
    const store = contendedStore();
    const changes: unknown[] = [];
    store.connect({ reducer: "audit", property: "entries" }, (c) => changes.push(c));

    await store.emit("plan", "patch", { steps: 1, expected: 999 });

    expect(changes).toEqual([]);
  });

  it("reports the refusal through onRejected, naming the slice", async () => {
    const seen: Array<{ reason: string; slice: string }> = [];
    const store = contendedStore((r, _e, slice) => seen.push({ reason: r.reason, slice }));

    await store.emit("plan", "patch", { steps: 1, expected: 42 });

    expect(seen).toHaveLength(1);
    expect(seen[0]!.slice).toBe("plan");
    expect(seen[0]!.reason).toMatch(/expected v42/);
  });

  it("still counts as committed — middleware did not veto it", async () => {
    const store = contendedStore();
    const result = await store.emit("plan", "patch", { steps: 1, expected: 42 });

    // `committed` means "not vetoed" and keeps meaning that. A refusal happens after middleware
    // has already let the event through, so conflating the two would lose which one occurred.
    expect(result.committed).toBe(true);
    expect(result.written).toBe(false);
  });
});

describe("the emit result tells a caller what happened to its write", () => {
  it("distinguishes written from considered-and-unchanged", async () => {
    const store = build({
      name: "noop",
      reducer: {
        plan: {
          state: { steps: 0, version: 1 },
          when: { keys: [["plan", "patch"]] },
          // Returns its own state: nothing to do, which is not the same as refusing.
          reducer: (state) => state,
        },
        audit: { state: { entries: 0 }, when: { keys: [["app", "touch"]] }, reducer: (s) => s },
      },
    });

    const result = await store.emit("plan", "patch", { steps: 1 });

    expect(result).toEqual({ committed: true, written: false });
    expect(result.rejected).toBeUndefined();
  });

  it("reports a middleware veto as neither committed nor written", async () => {
    const store = build({
      name: "vetoed",
      reducer: {
        plan: {
          state: { steps: 0, version: 1 },
          when: { keys: [["plan", "patch"]] },
          reducer: (s) => ({ ...s, steps: s.steps + 1 }),
        },
        audit: { state: { entries: 0 }, when: { keys: [["app", "touch"]] }, reducer: (s) => s },
      },
      middleware: [() => false],
    });

    expect(await store.emit("plan", "patch", { steps: 1 })).toEqual({
      committed: false,
      written: false,
    });
  });
});

describe("the written phase", () => {
  it("fires only when state changed, and after it changed", async () => {
    const store = contendedStore();
    const seen: Array<{ phase: string; steps: number }> = [];

    store.onEvent(
      "plan",
      "patch",
      (_e, getState, _emit, phase) => {
        seen.push({ phase, steps: (getState() as { plan: PlanState }).plan.steps });
      },
      "written",
    );

    await store.emit("plan", "patch", { steps: 3 });
    await store.emit("plan", "patch", { steps: 9, expected: 999 }); // refused

    // One notification, carrying the state as written — not as it was before.
    expect(seen).toEqual([{ phase: "written", steps: 3 }]);
  });

  it("does not narrow `committed`, which an event-only store depends on", async () => {
    // No reducers at all: nothing is ever written, by construction. This is the shape a
    // notification or analytics bus takes, and narrowing `committed` would have silently
    // stopped every one of them firing.
    const store = createStore<Record<string, never>, EM>({ name: "bus" });
    const committed: string[] = [];
    const written: string[] = [];

    store.onEvent("app", "touch", () => {
      committed.push("hit");
    });
    store.onEvent(
      "app",
      "touch",
      () => {
        written.push("hit");
      },
      "written",
    );

    const result = await store.emit("app", "touch", null);

    expect(committed).toEqual(["hit"]);
    expect(written).toEqual([]);
    expect(result).toEqual({ committed: true, written: false });
  });

  it("does not reach `all` subscribers", async () => {
    const store = contendedStore();
    const phases: string[] = [];
    store.onEvent(
      "plan",
      "patch",
      (_e, _g, _em, phase) => {
        phases.push(phase);
      },
      "all",
    );

    await store.emit("plan", "patch", { steps: 4 });

    // Committed once. Folding `written` into `all` would hand every existing subscriber a
    // second notification per written event and quietly double their counts.
    expect(phases).toEqual(["committed"]);
  });
});

describe("the Rejection sentinel", () => {
  it("recognises a rejection and nothing else", () => {
    expect(isRejected(Rejected("nope"))).toBe(true);
    expect(isRejected({ reason: "nope" })).toBe(false);
    expect(isRejected(null)).toBe(false);
    expect(isRejected("nope")).toBe(false);
    expect(isRejected({ steps: 1 })).toBe(false);
  });

  it("is branded so a second copy of the package still recognises it", () => {
    // `Symbol.for`, not `Symbol()`. A duplicated dependency or a bundle that inlined a second
    // copy can put two copies of this module in one process; with a unique symbol the check
    // would answer false across that boundary and a refusal would read as ordinary state.
    const foreign = { [Symbol.for("yoltra.rejected")]: true, reason: "from elsewhere" };
    expect(isRejected(foreign)).toBe(true);
  });
});

describe("instrumentation sees the refusal", () => {
  it("reports it beside committed, which cannot express it", async () => {
    const store = contendedStore();
    const seen: Array<{ committed: boolean; rejected?: Rejection }> = [];
    store.instrument((info) => seen.push({ committed: info.committed, rejected: info.rejected }));

    await store.emit("plan", "patch", { steps: 1, expected: 999 });

    expect(seen[0]!.committed).toBe(true);
    expect(seen[0]!.rejected?.reason).toMatch(/stale write/);
  });

  it("leaves it absent when nothing was refused", async () => {
    const store = contendedStore();
    const seen: Array<Record<string, unknown>> = [];
    store.instrument((info) => seen.push(info as never));

    await store.emit("plan", "patch", { steps: 1 });

    expect("rejected" in seen[0]!).toBe(false);
  });
});

describe("throw-isolation is unchanged", () => {
  it("isolates a throwing slice while its sibling still commits", async () => {
    const onReducerError = vi.fn();
    const store = build({
      name: "throwing",
      reducer: {
        plan: {
          state: { steps: 0, version: 1 },
          when: { keys: [["plan", "patch"]] },
          reducer: () => {
            throw new Error("bug");
          },
        },
        audit: {
          state: { entries: 0 },
          when: { keys: [["plan", "patch"]] },
          reducer: (s) => ({ entries: s.entries + 1 }),
        },
      },
      onReducerError,
    });
    vi.spyOn(console, "error").mockImplementation(() => undefined);

    const result = await store.emit("plan", "patch", { steps: 1 });

    // A crash is not a refusal. The failing slice keeps its state, the sibling writes, and the
    // event still counts as written — the opposite of what Rejected does, deliberately.
    expect(result).toEqual({ committed: true, written: true });
    expect(store.getState().plan.steps).toBe(0);
    expect(store.getState().audit.entries).toBe(1);
    expect(onReducerError).toHaveBeenCalledOnce();
    vi.restoreAllMocks();
  });
});
