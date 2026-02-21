import type { StoreInstance } from "@yoltra/core";

/**
 * A single pixel-dot in the logo animation.
 * Its position is updated every frame by the simulation.
 * Color is read from the source PNG and never changes after the first insert. */
export type Dot = {
  id: string;
  x: number;
  y: number;
  /** Hex color sampled from the logo pixel, e.g. "#3A7BD5" */
  color: string;
};

/**
 * Position update emitted by the simulation each frame.
 * `color` is required on the initial insert; the reducer preserves
 * it on subsequent position-only updates. */
export type DotUpdate = {
  id: string;
  x: number;
  y: number;
  color: string;
};

/** Shape of the `pixel` reducer slice. */
export type PixelState = {
  /** Whether the animation loop is running. */
  enabled: boolean;

  /** Smoothed FPS, updated at ~4 Hz. */
  fps: number;

  /** Total number of dots extracted from the logo. */
  count: number;

  /** Logical size of the SVG viewport (matches the source image dimensions). */
  size: { height: number; width: number };

  /**
   * The live dictionary of dots keyed by their id.
   * Atomic subscribers (`useAtomicProp`) watch individual `dots.<id>` paths,
   * so only the touched dot components re-render each frame. */
  dots: Record<string, Dot>;

  /** Intro animation tracking. */
  intro: { remaining: number; total: number; done: boolean };
};

/** Event map for the `pixel` channel. */
export type PixelEM = {
  /** Pause the animation loop. */
  stop: Record<string, never>;

  /** Resume the animation loop. */
  start: Record<string, never>;

  /** Updated smoothed FPS reading. */
  fps: { fps: number };

  /** SVG viewport dimensions. */
  size: { height: number; width: number };

  /** Total dot count, emitted once after image extraction. */
  count: { total: number };

  /**
   * Per-frame batch of position updates.
   * Only moved dots are included — the reducer skips no-op entries. */
  batchUpdate: { changes: DotUpdate[] };

  /** Progress of the intro fly-in animation. */
  introProgress: { remaining: number; total: number };

  /** Fired once when every dot has reached its home pixel. */
  introComplete: Record<string, never>;
};

/** Application state. */
export interface AppState {
  pixel: PixelState;
}

/** Application-wide event map. */
export type AppEM = {
  pixel: PixelEM;
  on: {
    /** Pointer position in SVG user-space coordinates. */
    mousemove: { x: number; y: number };
  };
};

/** Fully typed store instance for this app. */
export type AppStore = StoreInstance<keyof AppState & string, AppState, AppEM>;
