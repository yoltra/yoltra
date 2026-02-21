import type { AppStore } from "../../state/types";

// ---------------------------------------------------------------------------
// Lifecycle
// ---------------------------------------------------------------------------

export interface Lifecycle {
  init(): Promise<void> | void;
  start(): void;
  stop(): void;
  pause(): void;
  loop(dt: number, now: number): void;
  teardown(): void;
}

// ---------------------------------------------------------------------------
// Dot item
// ---------------------------------------------------------------------------

export type DotItemParams = {
  /** Hex color sampled from the source pixel. */
  color: string;
  /** Home x coordinate (pixel position in the logo image). */
  x: number;
  /** Home y coordinate. */
  y: number;
  /** Radius for collision queries. */
  r: number;
  /** Intro start x — random off-screen position. */
  startX: number;
  /** Intro start y. */
  startY: number;
  /** Delay before the dot starts moving toward home (seconds). */
  delay: number;
  /**
   * Exponential approach speed: half-life ≈ 1/factor seconds.
   * Higher → faster convergence. */
  factor: number;
};

export interface DotItemSpec {
  id: string;
  type: "Dot";
  params: DotItemParams;
}

/** Update payload emitted by a DotItem each frame it moves. */
export type XYUpdate = {
  id: string;
  x: number;
  y: number;
  color: string;
  __justFinishedIntro__?: boolean;
};

export interface DotItemInstance extends Lifecycle {
  readonly id: string;
  readonly color: string;
  x: number;
  y: number;
  /** True while the dot is still flying in to its home pixel. */
  intro: boolean;
  loop(dt: number, now: number): XYUpdate | void;
  onMousemove(mouse: { x: number; y: number }): XYUpdate | void;
}

// ---------------------------------------------------------------------------
// Simulation
// ---------------------------------------------------------------------------

export interface SimulationConfig {
  items: DotItemSpec[];
  name?: string;
}

export interface SimulationInstance extends Lifecycle {
  readonly name?: string;
  readonly engine: EngineInstance;
  readonly items: Record<string, DotItemInstance>;
  mouse: { x: number; y: number };
}

// ---------------------------------------------------------------------------
// Engine
// ---------------------------------------------------------------------------

export interface EngineConfig {
  /** Target FPS (informational, not a hard cap). Default 60. */
  targetFPS?: number;
  /** Hard clamp for dt spikes in ms. Default 66.7 (~15 FPS min). */
  maxDeltaMs?: number;
  /** Global time scale (1 = real-time). Default 1. */
  timeScale?: number;
  /** Rolling FPS sample size for smoothing. Default 30. */
  fpsSampleSize?: number;
  /** Start immediately after init(). Default false. */
  autoStart?: boolean;
  /** Optional simulation to attach at construction time. */
  simulation?: SimulationConfig;
}

export interface EngineInstance extends Lifecycle {
  readonly cfg: EngineConfig;
  readonly store?: AppStore;
  simulation?: SimulationInstance;
  readonly lastNow: number | null;
  readonly dt: number;
  readonly fps: number;
  readonly _running: boolean;
  attach(sim: SimulationInstance): void;
}
