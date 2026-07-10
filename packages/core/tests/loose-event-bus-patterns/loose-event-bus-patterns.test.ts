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
