/**
 * Where an anchored overlay goes, as arithmetic.
 *
 * @remarks
 * Deliberately a pure module — no React, no DOM. Positioning is the part of an overlay most
 * likely to be subtly wrong (off by the offset, flipping when it did not need to, clamped into
 * the anchor it was meant to avoid), and it is also the part jsdom cannot exercise: jsdom runs
 * no layout, so every `getBoundingClientRect` in a test returns zeros. Testing this through a
 * rendered component would assert that `0` equals `0`.
 *
 * Keeping the maths here means it is checked against real rectangles, and the hook that calls it
 * has nothing left to get wrong but measuring.
 *
 * @module
 */

/** Which edge of the anchor the overlay sits against. */
export type Side = "top" | "right" | "bottom" | "left";
/** How it lines up along the anchor's other axis. */
export type Alignment = "start" | "center" | "end";
/** A side, optionally with an alignment: `"bottom"`, `"bottom-start"`, `"left-end"`. */
export type Placement = Side | `${Side}-${Alignment}`;

/** A rectangle in viewport coordinates, as `getBoundingClientRect` reports one. */
export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface PlacementInput {
  /** The element (or point) being anchored to. A point is a zero-sized rect. */
  anchor: Rect;
  /** The overlay's own measured size. */
  floating: { width: number; height: number };
  viewport: { width: number; height: number };
  placement: Placement;
  /** Gap between anchor and overlay, in px. */
  offset?: number;
  /** Minimum distance kept from the viewport edge, in px. */
  padding?: number;
}

export interface PlacementResult {
  /** Viewport coordinates, for a `position: fixed` overlay. */
  x: number;
  y: number;
  /** What was actually used, which differs from the request when it flipped. */
  placement: Placement;
  flipped: boolean;
}

/** @internal */
const OPPOSITE: Record<Side, Side> = {
  top: "bottom",
  bottom: "top",
  left: "right",
  right: "left",
};

/** @internal */
function parse(placement: Placement): { side: Side; alignment: Alignment } {
  const [side, alignment] = placement.split("-") as [Side, Alignment | undefined];
  return { side, alignment: alignment ?? "center" };
}

/** @internal */
function clamp(value: number, min: number, max: number): number {
  // `max` first: when the overlay is wider than the space available, the low edge is the one to
  // respect — clamping the other way would push it off the near side to honour the far one.
  return Math.max(min, Math.min(value, max));
}

/**
 * How much room lies between the anchor and each viewport edge, padding already taken out.
 * @internal
 */
function freeSpace(anchor: Rect, viewport: { width: number; height: number }, padding: number) {
  return {
    top: anchor.y - padding,
    bottom: viewport.height - (anchor.y + anchor.height) - padding,
    left: anchor.x - padding,
    right: viewport.width - (anchor.x + anchor.width) - padding,
  } satisfies Record<Side, number>;
}

/** @internal */
function coordinates(
  side: Side,
  alignment: Alignment,
  anchor: Rect,
  floating: { width: number; height: number },
  offset: number,
): { x: number; y: number } {
  const alignAlong = (anchorStart: number, anchorSize: number, floatingSize: number): number => {
    if (alignment === "start") return anchorStart;
    if (alignment === "end") return anchorStart + anchorSize - floatingSize;
    return anchorStart + (anchorSize - floatingSize) / 2;
  };

  switch (side) {
    case "top":
      return {
        x: alignAlong(anchor.x, anchor.width, floating.width),
        y: anchor.y - floating.height - offset,
      };
    case "bottom":
      return {
        x: alignAlong(anchor.x, anchor.width, floating.width),
        y: anchor.y + anchor.height + offset,
      };
    case "left":
      return {
        x: anchor.x - floating.width - offset,
        y: alignAlong(anchor.y, anchor.height, floating.height),
      };
    case "right":
      return {
        x: anchor.x + anchor.width + offset,
        y: alignAlong(anchor.y, anchor.height, floating.height),
      };
  }
}

/**
 * Resolves a requested placement into viewport coordinates, flipping and clamping as needed.
 *
 * @remarks
 * Two corrections, in this order, because they answer different questions:
 *
 * **Flip** handles the main axis — the one the side is on. A menu requested below a trigger near
 * the bottom of the window has nowhere to go, and shrinking it or letting it hang off-screen are
 * both worse than putting it above. It flips only when the opposite side actually fits, so an
 * overlay taller than the window stays where it was asked to go rather than jumping to a side
 * that overflows just as much.
 *
 * **Clamp** handles the cross axis. A `bottom-start` menu whose trigger sits near the right edge
 * would run past it; sliding it left keeps it on screen without changing which side it is on.
 * Only the cross axis is clamped — clamping the main axis would slide the overlay over the very
 * element it is describing.
 *
 * @example
 * ```ts
 * const { x, y, placement } = resolvePlacement({
 *   anchor: trigger.getBoundingClientRect(),
 *   floating: { width: 220, height: 180 },
 *   viewport: { width: window.innerWidth, height: window.innerHeight },
 *   placement: "bottom-start",
 * });
 * ```
 *
 * @public
 */
export function resolvePlacement({
  anchor,
  floating,
  viewport,
  placement,
  offset = 8,
  padding = 8,
}: PlacementInput): PlacementResult {
  const { side: requested, alignment } = parse(placement);
  const space = freeSpace(anchor, viewport, padding);

  const vertical = requested === "top" || requested === "bottom";
  const needed = (vertical ? floating.height : floating.width) + offset;

  const opposite = OPPOSITE[requested];
  // Flip only when the other side actually fits. "Whichever has more room" sounds equivalent but
  // is not: an overlay taller than the window overflows either way, and moving it for a few
  // percent more visible area buys nothing while making the position unpredictable. Content that
  // large wants a max-height, not a different side.
  const flipped = space[requested] < needed && space[opposite] >= needed;
  const side = flipped ? opposite : requested;

  const { x, y } = coordinates(side, alignment, anchor, floating, offset);
  const onMainAxisY = side === "top" || side === "bottom";

  return {
    // Clamping is cross-axis only. On the main axis the offset is what keeps the overlay clear
    // of its anchor, and clamping there would undo it.
    x: onMainAxisY ? clamp(x, padding, viewport.width - floating.width - padding) : x,
    y: onMainAxisY ? y : clamp(y, padding, viewport.height - floating.height - padding),
    placement: alignment === "center" ? side : (`${side}-${alignment}` as Placement),
    flipped,
  };
}
