/**
 * The pixel reducer's identity guarantees, asserted as identities.
 *
 * @remarks
 * This example's whole pitch is that a thousand dots can move at sixty frames a second
 * because only the dots that moved produce new references — `useAtomicProp` subscribers for
 * everything else compare by reference and never re-render. That contract lives in the
 * reducer's lazy-allocation strategy, so the tests here assert object identity, not values:
 * a stationary dot must come out of a batch as the *same object* that went in.
 *
 * Fresh store per test, built from the reducer spec alone — the app's store module also
 * attaches the devtools agent, which a reducer test has no business dragging in.
 */

import { createStore } from "@yoltra/core";
import { describe, expect, it } from "vitest";

import { pixelReducer } from "../src/state/pixel/Pixel.reducer";
import type { AppEM, PixelState } from "../src/state/types";

const build = () =>
  createStore<{ pixel: PixelState }, AppEM>({
    name: "pixel-test",
    reducer: { pixel: pixelReducer },
  });

const dot = (id: string, x: number, y: number) => ({ id, x, y, color: "#1A7FE2" });

describe("the pixel reducer's identity guarantees", () => {
  it("inserts dots it has never seen", async () => {
    const store = build();
    await store.emit("pixel", "batchUpdate", { changes: [dot("a", 1, 1), dot("b", 2, 2)] });

    expect(store.getState().pixel.dots["a"]).toMatchObject({ x: 1, y: 1 });
    expect(store.getState().pixel.dots["b"]).toMatchObject({ x: 2, y: 2 });
  });

  it("gives a new reference only to the dot that moved", async () => {
    const store = build();
    await store.emit("pixel", "batchUpdate", { changes: [dot("a", 1, 1), dot("b", 2, 2)] });
    const before = store.getState().pixel.dots;

    // `b` is reported but has not moved; `a` has.
    await store.emit("pixel", "batchUpdate", { changes: [dot("a", 5, 5), dot("b", 2, 2)] });

    const after = store.getState().pixel.dots;
    expect(after["a"]).not.toBe(before["a"]);
    expect(after["a"]).toMatchObject({ x: 5, y: 5 });
    // The stationary dot is the same object, so its subscriber never re-renders.
    expect(after["b"]).toBe(before["b"]);
  });

  it("returns the same state when no reported dot actually moved", async () => {
    const store = build();
    await store.emit("pixel", "batchUpdate", { changes: [dot("a", 1, 1)] });
    const before = store.getState().pixel;

    await store.emit("pixel", "batchUpdate", { changes: [dot("a", 1, 1)] });

    // Not merely equal — identical. A quiet frame costs zero re-renders anywhere.
    expect(store.getState().pixel).toBe(before);
  });

  it("preserves a dot's colour across moves", async () => {
    const store = build();
    await store.emit("pixel", "batchUpdate", { changes: [dot("a", 1, 1)] });
    await store.emit("pixel", "batchUpdate", {
      changes: [{ id: "a", x: 9, y: 9, color: "#ff0000" }],
    });

    // Colour is static after the first insert; a move does not repaint.
    expect(store.getState().pixel.dots["a"]?.color).toBe("#1A7FE2");
  });

  it("ignores everything except start while stopped", async () => {
    const store = build();
    await store.emit("pixel", "batchUpdate", { changes: [dot("a", 1, 1)] });
    await store.emit("pixel", "stop", {});
    const paused = store.getState().pixel;

    await store.emit("pixel", "batchUpdate", { changes: [dot("a", 7, 7)] });
    await store.emit("pixel", "fps", { fps: 60 });
    expect(store.getState().pixel).toBe(paused);

    await store.emit("pixel", "start", {});
    expect(store.getState().pixel.enabled).toBe(true);
    await store.emit("pixel", "batchUpdate", { changes: [dot("a", 7, 7)] });
    expect(store.getState().pixel.dots["a"]).toMatchObject({ x: 7, y: 7 });
  });

  it("dedupes readings that carry the value the state already holds", async () => {
    const store = build();
    await store.emit("pixel", "fps", { fps: 60 });
    await store.emit("pixel", "size", { width: 800, height: 400 });
    const before = store.getState().pixel;

    await store.emit("pixel", "fps", { fps: 60 });
    await store.emit("pixel", "size", { width: 800, height: 400 });
    await store.emit("pixel", "count", { total: 0 });

    expect(store.getState().pixel).toBe(before);
  });

  it("tracks the intro until it declares itself done", async () => {
    const store = build();
    await store.emit("pixel", "introProgress", { remaining: 40, total: 100 });
    expect(store.getState().pixel.intro).toMatchObject({ remaining: 40, total: 100, done: false });

    await store.emit("pixel", "introComplete", {});
    expect(store.getState().pixel.intro).toMatchObject({ remaining: 0, done: true });
  });
});
