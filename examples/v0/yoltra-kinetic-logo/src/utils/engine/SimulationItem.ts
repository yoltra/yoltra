import type { DotItemInstance, DotItemSpec, EngineInstance, XYUpdate } from "./types";

export abstract class SimulationItem implements DotItemInstance {
  readonly id: string;
  readonly engine: EngineInstance;
  readonly color: string;

  x = 0;
  y = 0;
  intro = true;

  constructor(engine: EngineInstance, spec: DotItemSpec) {
    this.engine = engine;
    this.id = spec.id;
    this.color = spec.params.color;
  }

  init(): void {}
  start(): void {}
  stop(): void {}
  pause(): void {}
  loop(_dt: number, _now: number): XYUpdate | void {}
  onMousemove(_mouse: { x: number; y: number }): XYUpdate | void {}
  teardown(): void {}
}
