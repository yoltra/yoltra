import type { ReducerSpec } from "@yoltra/core";
import type { AppEM, Dot, PixelState } from "../types";

export const PIXEL_INITIAL_STATE: PixelState = {
  enabled: true,
  fps: 0,
  count: 0,
  size: { height: 0, width: 0 },
  dots: Object.create(null) as Record<string, Dot>,
  intro: { remaining: 0, total: 0, done: false },
};

/**
 * Pixel reducer — manages the `pixel` state slice.
 *
 * ## Performance design
 *
 * The hot path is `batchUpdate`, called every animation frame with up to
 * 1 000 position changes. The implementation uses a *lazy-allocation*
 * strategy: the `dots` record is spread **at most once per event**,
 * regardless of how many dots changed. This is critical because:
 *
 *   Old approach: N spreads of the group record + N state spreads per event
 *   New approach: 1 spread of `dots` + 1 state spread per event (always)
 *
 * The Yoltra store then compares each dot's reference (`dots.dot_0`,
 * `dots.dot_1`, …) with the previous value to decide which `useAtomicProp`
 * subscribers need to re-render. Only subscribers for dots whose object
 * reference changed will fire — i.e. only the dots that actually moved. */
export const pixelReducer: ReducerSpec<PixelState, AppEM> = {
  // Modern `when` matcher: this reducer handles the entire `pixel` channel.
  when: { channel: "pixel" },
  state: PIXEL_INITIAL_STATE,

  reducer: (state, event) => {
    // When the animation is paused every event except `start` is a no-op.
    if (!state.enabled && event.type !== "start") return state;

    switch (event.type) {
      case "start":
        return state.enabled ? state : { ...state, enabled: true };

      case "stop":
        return state.enabled ? { ...state, enabled: false } : state;

      case "fps": {
        const { fps } = event.payload as { fps: number };
        return state.fps === fps ? state : { ...state, fps };
      }

      case "size": {
        const { height, width } = event.payload as { height: number; width: number };
        const s = state.size;
        return s.height === height && s.width === width
          ? state
          : { ...state, size: { height, width } };
      }

      case "count": {
        const { total } = event.payload as { total: number };
        return state.count === total ? state : { ...state, count: total };
      }

      case "batchUpdate": {
        const { changes } = event.payload as { changes: { id: string; x: number; y: number; color: string }[] };
        if (!changes.length) return state;

        /**
         * Lazy allocation: allocate `nextDots` only when the first real
         * change is detected.  This avoids an O(N) spread on frames where
         * all dots are stationary (e.g. after intro completes and the user
         * isn't moving the mouse). */
        let nextDots: Record<string, Dot> | null = null;

        for (const c of changes) {
          // Read from the in-progress copy if we already started one,
          // otherwise read from the current committed state.
          const prev = (nextDots ?? state.dots)[c.id];

          if (!prev) {
            // ── First insert ─────────────────────────────────────────────
            // Dot is not yet in state (happens during the init batch).
            // Allocate the copy lazily, then insert.
            if (!nextDots) nextDots = { ...state.dots };
            nextDots[c.id] = { id: c.id, x: c.x, y: c.y, color: c.color };
            continue;
          }

          // ── Position update ───────────────────────────────────────────
          // Only create a new dot object when the position actually changed.
          // Yoltra's atomic subscriptions use reference equality, so leaving
          // `prev` in place means zero re-renders for stationary dots.
          if (c.x !== prev.x || c.y !== prev.y) {
            if (!nextDots) nextDots = { ...state.dots };
            // Preserve color — it is static after the first insert.
            nextDots[c.id] = { id: c.id, x: c.x, y: c.y, color: prev.color };
          }
        }

        // No dot actually changed → return same reference, no re-renders.
        return nextDots ? { ...state, dots: nextDots } : state;
      }

      case "introProgress": {
        const { remaining, total } = event.payload as { remaining: number; total: number };
        return {
          ...state,
          intro: { ...state.intro, remaining, total },
        };
      }

      case "introComplete":
        return {
          ...state,
          intro: { ...state.intro, remaining: 0, done: true },
        };

      default:
        return state;
    }
  },
};
