import type { EngineInstance, SimulationItemInstance, SimulationItemSpec } from "./types";

export abstract class SimulationItem implements SimulationItemInstance {
  public readonly id: string;
  public readonly type: string;
  public readonly engine: EngineInstance;

  constructor(engine: EngineInstance, spec: SimulationItemSpec) {
    this.engine = engine;
    this.id = spec.id;
    this.type = spec.type;
  }

  intro?: boolean | undefined;

  init(): void | Promise<void> {}
  start(): void {}
  stop(): void {}
  pause(): void {}
  loop(_dt: number, _now: number): void {}
  teardown(): void {}
}