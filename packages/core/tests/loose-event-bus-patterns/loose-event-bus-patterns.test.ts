import { describe, it, expect, vi, beforeEach } from "vitest";
import { LooseEventBus } from "../../src/eventBus/LooseEventBus";

type Channel = "ui" | "data";

describe("LooseEventBus - exact vs pattern behaviour", () => {
  let bus: LooseEventBus<Channel, string, any>;

  beforeEach(() => {
    bus = new LooseEventBus<Channel, string, any>();
  });

  it("supports exact subscriptions with normalised keys", () => {
    const calls: string[] = [];

    const h = (p: any) => calls.push(`exact:${p}`);

    bus.on("ui", "panel.open", h);
    bus.emit("ui", "panel.open", 1);
    bus.emit("ui", ".panel.open", 2); // type argument is a string, still normalised in emit

    // now subscribe with leading dot and remove through off()
    const h2 = (p: any) => calls.push(`dot:${p}`);
    bus.on("ui", ".panel.open" as any, h2);
    bus.emit("ui", "panel.open", 3);

    bus.off("ui", ".panel.open" as any, h2);
    bus.emit("ui", "panel.open", 4);

    expect(calls).toEqual([
      "exact:1",
      "exact:2",
      "exact:3",
      "dot:3",
      "exact:4",
    ]);
  });

  it("supports simple '*' patterns", () => {
    const calls: string[] = [];
    bus.on("ui", "panel.*", () => calls.push("star"));

    bus.emit("ui", "panel.open", null);
    bus.emit("ui", "panel.close", null);
    bus.emit("ui", "panel.deep.nested", null); // should not match
    bus.emit("ui", "other", null); // should not match

    expect(calls).toEqual(["star", "star"]);
  });

  it("supports '**' patterns for zero or more segments", () => {
    const calls: string[] = [];
    bus.on("ui", "panel.**", () => calls.push("glob"));

    bus.emit("ui", "panel", null);
    bus.emit("ui", "panel.open", null);
    bus.emit("ui", "panel.deep.nested", null);
    bus.emit("ui", "other", null);

    expect(calls).toEqual(["glob", "glob", "glob"]);
  });

  it("handles adversarial glob patterns with backtracking (CORE-8)", () => {
    const hits: string[] = [];
    bus.on("ui", "**.**.end", () => hits.push("consec")); // consecutive **
    bus.on("ui", "a.**.b", () => hits.push("mid")); // ** in the middle (zero or more)
    bus.on("ui", "**.a.b", () => hits.push("back")); // requires backtracking

    bus.emit("ui", "x.y.end", null); // consec
    bus.emit("ui", "a.b", null); // mid (** = zero) + back (** = zero)
    bus.emit("ui", "a.x.y.b", null); // mid (** = x.y)
    bus.emit("ui", "z.a.b", null); // back (** = z)
    bus.emit("ui", "a.a.b", null); // mid + back

    expect(hits.sort()).toEqual(
      ["back", "back", "back", "consec", "mid", "mid", "mid"].sort(),
    );
  });

  it("de-dupes the same handler registered as exact and pattern", () => {
    const calls: string[] = [];
    const h = (p: any) => calls.push(`h:${p}`);
    const other = (p: any) => calls.push(`other:${p}`);

    bus.on("ui", "panel.open", h);
    bus.on("ui", "panel.*", h);
    bus.on("ui", "panel.**", other);

    bus.emit("ui", "panel.open", 1);

    expect(calls).toEqual(["h:1", "other:1"]);
  });

  it("multiple pattern handlers can match the same subject", () => {
    const calls: string[] = [];
    bus.on("ui", "x.*.end", () => calls.push("one"));  // matches x.y.end
    bus.on("ui", "**.end", () => calls.push("two"));   // matches any depth ending in .end
    bus.on("ui", "x.y.end", () => calls.push("exact")); // exact match

    bus.emit("ui", "x.y.end", null);

    expect(calls.sort()).toEqual(["exact", "one", "two"].sort());
  });

  it("unsubscribe from pattern via returned function stops future emits", () => {
    const calls: string[] = [];
    const off = bus.on("ui", "panel.*", () => calls.push("hit"));
    bus.emit("ui", "panel.open", null);
    off();
    bus.emit("ui", "panel.open", null);

    expect(calls).toEqual(["hit"]);
  });

  it("clear removes both exact and pattern handlers", () => {
    const calls: string[] = [];
    bus.on("ui", "panel.open", () => calls.push("exact"));
    bus.on("ui", "panel.*", () => calls.push("pattern"));

    bus.clear();
    bus.emit("ui", "panel.open", null);

    expect(calls).toEqual([]);
  });

  /**
   * Delivery narrows candidates by the subject's first segment rather than testing every
   * registered pattern. That index is derived state kept beside the handler map, and derived
   * state that is built in one place and torn down in another is where the bugs are.
   */
  describe("the pattern index stays in step with the handlers", () => {
    /**
     * Reaching into the private index on purpose.
     *
     * @remarks
     * A stale entry cannot be caught from the outside: delivery looks the pattern's handlers up
     * by name and skips it when there are none, and duplicate entries deliver to the same handler
     * reference, which the de-duplication then collapses. So the leak is invisible in behaviour
     * and shows up only as unbounded growth and repeated matching work — which means the
     * invariant has to be asserted where it lives.
     */
    const indexOf = (channel: string) =>
      (bus as unknown as {
        patternIndex: Map<string, { byHead: Map<string, unknown[]>; anyHead: unknown[] }>;
      }).patternIndex.get(channel);

    it("re-subscribes a pattern that was fully unsubscribed", () => {
      const calls: string[] = [];
      // A second pattern on the channel, so the channel survives the first one leaving. Without
      // it, removing the only pattern drops the whole channel index — which cleans up correctly
      // for the wrong reason and hides whether individual entries are ever removed.
      bus.on("ui", "other.*", () => calls.push("other"));
      const off = bus.on("ui", "panel.*", () => calls.push("first"));
      off();
      bus.on("ui", "panel.*", () => calls.push("second"));
      bus.emit("ui", "panel.open", null);

      expect(calls).toEqual(["second"]);
      // One entry, not two: the pattern left the handler map, so it had to leave the index.
      expect(indexOf("ui")?.byHead.get("panel")).toHaveLength(1);
    });

    it("keeps delivering to a pattern while any handler on it remains", () => {
      const calls: string[] = [];
      const off = bus.on("ui", "panel.*", () => calls.push("a"));
      bus.on("ui", "panel.*", () => calls.push("b"));
      off();
      bus.emit("ui", "panel.open", null);

      expect(calls).toEqual(["b"]);
    });

    it("still matches after clear and re-subscribe", () => {
      const calls: string[] = [];
      bus.on("ui", "panel.*", () => calls.push("gone"));
      bus.clear();
      expect(indexOf("ui")).toBeUndefined();

      bus.on("ui", "panel.*", () => calls.push("fresh"));
      bus.emit("ui", "panel.open", null);

      expect(calls).toEqual(["fresh"]);
      expect(indexOf("ui")?.byHead.get("panel")).toHaveLength(1);
    });

    it("tests patterns whose first segment is a wildcard against every subject", () => {
      // These cannot be narrowed by the subject's first segment — nothing about the subject
      // rules them out — so they have to be candidates for anything.
      const calls: string[] = [];
      bus.on("ui", "*.open", () => calls.push("star"));
      bus.on("ui", "**.end", () => calls.push("glob"));

      bus.emit("ui", "panel.open", null);
      bus.emit("ui", "anything.deeply.nested.end", null);
      bus.emit("ui", "unrelated.thing", null);

      expect(calls).toEqual(["star", "glob"]);
    });

    it("does not let one channel's patterns match another's subjects", () => {
      const calls: string[] = [];
      bus.on("ui", "panel.*", () => calls.push("ui"));
      bus.on("data", "panel.*", () => calls.push("data"));

      bus.emit("data", "panel.open", null);

      expect(calls).toEqual(["data"]);
    });
  });

  it("errors in handlers are logged and do not stop other handlers", () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => { });
    const calls: string[] = [];

    bus.on("ui", "panel.*", () => {
      throw new Error("boom");
    });
    bus.on("ui", "panel.*", () => {
      calls.push("ok");
    });

    bus.emit("ui", "panel.open", null);

    expect(calls).toEqual(["ok"]);
    expect(errorSpy).toHaveBeenCalled();

    errorSpy.mockRestore();
  });
});
