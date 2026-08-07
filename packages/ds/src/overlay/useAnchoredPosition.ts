"use client";

import { useCallback, useEffect, useLayoutEffect, useState } from "react";

import { resolvePlacement, type Placement, type Rect } from "./placement";

/** A pointer position, for a context menu that has no anchor element. */
export interface Point {
  x: number;
  y: number;
}

export interface AnchoredPositionOptions {
  placement?: Placement;
  offset?: number;
  padding?: number;
  /** Whether the overlay is open; measurement is skipped when it is not. */
  active: boolean;
}

export interface AnchoredPosition {
  x: number;
  y: number;
  placement: Placement;
  /**
   * Whether a measurement has happened yet.
   *
   * @remarks
   * The overlay has to be in the DOM before it can be measured, so there is one frame where it
   * exists at no particular position. Rendering it hidden until this turns true is what stops
   * that frame showing up as a flash in the top-left corner.
   */
  positioned: boolean;
}

/** @internal */
function rectOf(anchor: HTMLElement | Point): Rect {
  if (anchor instanceof HTMLElement) {
    const r = anchor.getBoundingClientRect();
    return { x: r.x, y: r.y, width: r.width, height: r.height };
  }
  // A point is a zero-sized rectangle, which every placement rule already handles.
  return { x: anchor.x, y: anchor.y, width: 0, height: 0 };
}

/**
 * Keeps a floating element positioned against an anchor element or a pointer position.
 *
 * @remarks
 * Coordinates are viewport-relative, and the overlay is `position: fixed`, so no
 * offset-parent arithmetic is involved — which is the usual source of "correct everywhere except
 * inside that one scrolling panel" bugs.
 *
 * Recomputed on scroll and resize. The scroll listener is registered in the capture phase because
 * scroll events do not bubble: an ancestor that scrolls would otherwise move the anchor without
 * the overlay hearing about it, leaving the two visibly disconnected.
 *
 * @internal
 */
export function useAnchoredPosition(
  anchor: HTMLElement | Point | null,
  floating: HTMLElement | null,
  { placement = "bottom", offset = 8, padding = 8, active }: AnchoredPositionOptions,
): AnchoredPosition {
  const [position, setPosition] = useState<AnchoredPosition>({
    x: 0,
    y: 0,
    placement,
    positioned: false,
  });

  const measure = useCallback(() => {
    if (!active || anchor === null || floating === null) return;
    const rect = floating.getBoundingClientRect();
    const resolved = resolvePlacement({
      anchor: rectOf(anchor),
      floating: { width: rect.width, height: rect.height },
      viewport: { width: window.innerWidth, height: window.innerHeight },
      placement,
      offset,
      padding,
    });
    setPosition({ ...resolved, positioned: true });
  }, [active, anchor, floating, placement, offset, padding]);

  // Layout effect, so the position is applied in the same commit the overlay first paints in.
  // A passive effect would show it unpositioned for a frame.
  useLayoutEffect(() => {
    if (!active) {
      setPosition((current) => (current.positioned ? { ...current, positioned: false } : current));
      return;
    }
    measure();
  }, [active, measure]);

  useEffect(() => {
    if (!active) return;
    const onChange = () => measure();
    window.addEventListener("resize", onChange);
    window.addEventListener("scroll", onChange, true);
    return () => {
      window.removeEventListener("resize", onChange);
      window.removeEventListener("scroll", onChange, true);
    };
  }, [active, measure]);

  return position;
}
