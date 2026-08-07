import { describe, expect, it } from "vitest";

import { resolvePlacement, type Rect } from "../src/overlay/placement";

/**
 * The placement arithmetic, against real rectangles.
 *
 * @remarks
 * This is the file that makes the anchored overlays testable at all. jsdom runs no layout, so
 * every `getBoundingClientRect` in a component test returns zeros — a positioning assertion made
 * through a rendered popover would compare `0` with `0` and pass regardless of the maths. Keeping
 * the maths pure moves it somewhere it can actually be checked.
 */

const viewport = { width: 1000, height: 800 };
const floating = { width: 200, height: 100 };

/** A 40×20 anchor at (x, y). */
const anchorAt = (x: number, y: number): Rect => ({ x, y, width: 40, height: 20 });

describe("the requested side, when it fits", () => {
  const anchor = anchorAt(500, 400);

  it("puts a bottom placement under the anchor, offset clear of it", () => {
    const { y, placement, flipped } = resolvePlacement({
      anchor,
      floating,
      viewport,
      placement: "bottom",
      offset: 8,
    });
    expect(y).toBe(400 + 20 + 8);
    expect(placement).toBe("bottom");
    expect(flipped).toBe(false);
  });

  it("puts a top placement above it, allowing for its own height", () => {
    const { y } = resolvePlacement({ anchor, floating, viewport, placement: "top", offset: 8 });
    expect(y).toBe(400 - 100 - 8);
  });

  it("puts a left placement clear of the anchor's left edge", () => {
    const { x } = resolvePlacement({ anchor, floating, viewport, placement: "left", offset: 8 });
    expect(x).toBe(500 - 200 - 8);
  });

  it("puts a right placement clear of the anchor's right edge", () => {
    const { x } = resolvePlacement({ anchor, floating, viewport, placement: "right", offset: 8 });
    expect(x).toBe(500 + 40 + 8);
  });
});

describe("alignment along the cross axis", () => {
  const anchor = anchorAt(500, 400);

  it("centres by default, which for a wider overlay means overhanging both sides equally", () => {
    const { x } = resolvePlacement({ anchor, floating, viewport, placement: "bottom" });
    expect(x).toBe(500 + (40 - 200) / 2);
  });

  it("lines a start alignment up with the anchor's leading edge", () => {
    const { x } = resolvePlacement({ anchor, floating, viewport, placement: "bottom-start" });
    expect(x).toBe(500);
  });

  it("lines an end alignment up with the anchor's trailing edge", () => {
    const { x } = resolvePlacement({ anchor, floating, viewport, placement: "bottom-end" });
    expect(x).toBe(500 + 40 - 200);
  });

  it("aligns on the vertical axis for a horizontal side", () => {
    const { y } = resolvePlacement({ anchor, floating, viewport, placement: "right-start" });
    expect(y).toBe(400);
  });

  it("keeps the alignment through a flip", () => {
    // Near the bottom: the side changes, the alignment must not.
    const { placement } = resolvePlacement({
      anchor: anchorAt(500, 760),
      floating,
      viewport,
      placement: "bottom-start",
    });
    expect(placement).toBe("top-start");
  });
});

describe("flipping, when the requested side has no room", () => {
  it("flips a bottom placement above an anchor near the bottom edge", () => {
    const anchor = anchorAt(500, 760);
    const { y, placement, flipped } = resolvePlacement({
      anchor,
      floating,
      viewport,
      placement: "bottom",
      offset: 8,
    });
    expect(flipped).toBe(true);
    expect(placement).toBe("top");
    expect(y).toBe(760 - 100 - 8);
  });

  it("flips a top placement below an anchor near the top edge", () => {
    const { placement, flipped } = resolvePlacement({
      anchor: anchorAt(500, 10),
      floating,
      viewport,
      placement: "top",
    });
    expect(flipped).toBe(true);
    expect(placement).toBe("bottom");
  });

  it("flips a left placement to the right of an anchor near the left edge", () => {
    const { placement, x } = resolvePlacement({
      anchor: anchorAt(10, 400),
      floating,
      viewport,
      placement: "left",
      offset: 8,
    });
    expect(placement).toBe("right");
    expect(x).toBe(10 + 40 + 8);
  });

  it("stays put when the overlay does not fit on either side", () => {
    // Taller than the viewport: flipping trades one overflow for another, so it is not an
    // improvement — and an overlay that jumps sides for no gain is worse than one that does not.
    const tall = { width: 200, height: 900 };
    const { placement, flipped } = resolvePlacement({
      anchor: anchorAt(500, 400),
      floating: tall,
      viewport,
      placement: "bottom",
    });
    expect(flipped).toBe(false);
    expect(placement).toBe("bottom");
  });

  it("stays put when the requested side fits exactly", () => {
    // Room for the overlay plus its offset and no more. An off-by-one here would flip every
    // overlay that fits snugly, which is most of them on a short window.
    const anchor = anchorAt(500, 400);
    const exact = { width: 200, height: 800 - 420 - 8 - 8 };
    const { flipped } = resolvePlacement({
      anchor,
      floating: exact,
      viewport,
      placement: "bottom",
      offset: 8,
      padding: 8,
    });
    expect(flipped).toBe(false);
  });
});

describe("clamping, on the cross axis only", () => {
  it("pulls an overlay back inside the right edge", () => {
    const { x } = resolvePlacement({
      anchor: anchorAt(950, 400),
      floating,
      viewport,
      placement: "bottom-start",
      padding: 8,
    });
    expect(x).toBe(1000 - 200 - 8);
  });

  it("pushes an overlay back inside the left edge", () => {
    const { x } = resolvePlacement({
      anchor: anchorAt(4, 400),
      floating,
      viewport,
      placement: "bottom-end",
      padding: 8,
    });
    expect(x).toBe(8);
  });

  it("clamps vertically for a horizontal side", () => {
    const { y } = resolvePlacement({
      anchor: anchorAt(500, 780),
      floating,
      viewport,
      placement: "right-start",
      padding: 8,
    });
    expect(y).toBe(800 - 100 - 8);
  });

  it("never clamps the main axis over the anchor", () => {
    // The offset is the whole point of the main axis: clamping there would slide the overlay on
    // top of the element it is describing.
    const anchor = anchorAt(500, 780);
    const { y } = resolvePlacement({
      anchor,
      floating,
      viewport,
      placement: "top",
      offset: 8,
      padding: 8,
    });
    expect(y).toBe(780 - 100 - 8);
    expect(y + 100).toBeLessThanOrEqual(anchor.y);
  });

  it("prefers the near edge when the overlay is wider than the viewport allows", () => {
    const wide = { width: 1200, height: 100 };
    const { x } = resolvePlacement({
      anchor: anchorAt(500, 400),
      floating: wide,
      viewport,
      placement: "bottom",
      padding: 8,
    });
    // Clamping the other way round would honour the far edge and push the overlay off the near
    // one, hiding its beginning — which for a menu is the first item.
    expect(x).toBe(8);
  });
});

describe("a point anchor, as a context menu uses", () => {
  it("treats a zero-sized rect as the pointer position", () => {
    const point: Rect = { x: 300, y: 200, width: 0, height: 0 };
    const { x, y } = resolvePlacement({
      anchor: point,
      floating,
      viewport,
      placement: "bottom-start",
      offset: 0,
    });
    expect(x).toBe(300);
    expect(y).toBe(200);
  });

  it("flips a point anchor near the bottom-right corner into the visible quadrant", () => {
    const point: Rect = { x: 990, y: 790, width: 0, height: 0 };
    const { x, y, placement } = resolvePlacement({
      anchor: point,
      floating,
      viewport,
      placement: "bottom-start",
      offset: 0,
      padding: 8,
    });
    expect(placement).toBe("top-start");
    expect(y).toBe(790 - 100);
    expect(x).toBe(1000 - 200 - 8);
  });
});
