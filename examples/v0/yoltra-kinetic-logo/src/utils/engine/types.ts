import type { QuadTree } from "../Quadtree";

import type { AppStore, QuoPlegdes } from "../../state/types";

export interface Lifecycle {
  /**
   * one-time setup (allocate resources, create items) */
  init(): Promise<void> | void;

  /**
   * enter “running” state */
  start(): void;

  /**
   * stop and reset to an inert state but keep allocations available for a future start() */
  stop(): void;

  /**
   * temporarily suspend updates; keep state as-is for a future start() */
  pause(): void;

  /**
   * per-frame update. Engine computes dt and passes it down */
  loop(dt: number, now: number): void | {
    group: QuoPlegdes, id: string,
    x: number, y: number,
  };

  /**
   * final teardown; release resources. After this, instance is not reusable */
  teardown(): void;
}

export type CircleParams = {
  group: QuoPlegdes;
  color: string;
  delay: number;
  factor: number;

  x: number;
  y: number;
  r: number;

  startX: number;
  startY: number;
  startR: number;
  startColor: string;
}

export interface CircleSpec extends SimulationItemSpec {
  type: "Circle";
  params: CircleParams;
}

export interface SimulationItemSpec {
  id: string;

  /**
   * arbitrary discriminator */
  type: string;

  /**
   * item-local params */
  params: CircleParams;
}

export interface SimulationItemInstance extends Lifecycle {
  readonly id: string;
  readonly type: string;
  readonly engine: EngineInstance;

  intro?: boolean;
}

export interface SimulationConfig {
  /**
   * items to instantiate during init() */
  items: SimulationItemSpec[];

  /**
   * optional name for debugging */
  name?: string;
}

export interface SimulationInstance extends Lifecycle {
  readonly name?: string;
  readonly engine: EngineInstance;
  readonly items: Record<string, SimulationItemInstance>;

  quadtree: QuadTree;
  mouse: {
    x: number;
    y: number;
  }
}

export type XYRUpdate = {
  group: QuoPlegdes;
  id: string;
  x: number;
  y: number;
  __justFinishedIntro__?: boolean;
};

export interface EngineConfig {
  /**
   * target FPS (used for expected dt, not a hard cap). Default 60 */
  targetFPS?: number;

  /**
   * hard clamp for dt spikes in ms. Default 66.7 (~15 FPS) */
  maxDeltaMs?: number;

  /**
   * apply global time scaling (1 = real-time). Default 1 */
  timeScale?: number;

  /**
   * rolling FPS sample size for smoothing. Default 30 */
  fpsSampleSize?: number;

  /**
   * if true, start immediately after init(). Default false */
  autoStart?: boolean;

  /**
   * initial simulation */
  simulation?: SimulationConfig
}

export interface EngineInstance extends Lifecycle {
  readonly cfg: EngineConfig;
  /**
   * injected Quo store so Simulation/Items can this.engine.store.dispatch(...) */
  readonly store?: AppStore;

  /**
   * assigned once via attach(sim) or constructor injection pattern */
  simulation?: SimulationInstance;

  /** last timestamp from rAF */
  readonly lastNow: number | null;
  /**
   * last computed dt in ms (timeScale already applied) */
  readonly dt: number;
  /**
   * smoothed FPS */
  readonly fps: number;
  /**
   * is rAF running */
  readonly _running: boolean;

  /**
   * attach a Simulation instance after constructing the Engine (optional) */
  attach(sim: SimulationInstance): void;
}
