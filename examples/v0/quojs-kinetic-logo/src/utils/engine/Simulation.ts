import type { EngineInstance, SimulationConfig, SimulationInstance, SimulationItemInstance, XYRUpdate } from "./types";
import { Circle } from "./Circle";
import { QuadTree } from "../Quadtree";
import type { Unsubscribe } from "@quojs/core";
import type { AppAM, AppStore } from "../../state/types";

export class Simulation implements SimulationInstance {
  private _isEnabled = false;
  private introRemaining = 0;
  private introTotal = 0;
  private firedIntroComplete = false;

  public readonly name?: string;
  public readonly items: Record<string, SimulationItemInstance> = Object.create(null);
  public mouse: { x: number; y: number } = { x: 0, y: 0 };

  readonly cfg: SimulationConfig;
  readonly engine: EngineInstance;

  quadtree: QuadTree;

  private offMouseMove?: Unsubscribe;

  constructor(engine: EngineInstance, cfg: SimulationConfig) {
    this.engine = engine;
    this.cfg = cfg;
    this.name = cfg.name;
    this.quadtree = new QuadTree({ x: 0, y: 0, width: 1000, height: 500 });
  }

  init(): void {
    const store = (this.engine as any).store as AppStore | undefined;

    const { items } = this.cfg;
    for (const spec of items) {
      const instance = new Circle(this.engine, spec);
      this.items[spec.id] = instance;
      this.quadtree.insert(instance);
    }

    let remaining = 0;
    for (const item of Object.values(this.items)){
      if (item.intro) remaining++;
    }

    this.introRemaining = remaining;
    this.introTotal = Object.keys(this.items).length;

    store?.dispatch("logo", "introProgress", {
      remaining: this.introRemaining,
      total: this.introTotal,
    });

    for (const item of Object.values(this.items)) {
      item.init();
    }
  }

  start(): void {
    if (this._isEnabled) return;

    this._isEnabled = true;

    // reset completion path on each start (lets spiel trigger again)
    this.firedIntroComplete = false;

    // recompute introRemaining (in case items were reset externally)
    let remaining = 0;
    for (const item of Object.values(this.items)) {
      if (item.intro) remaining++;
    }
    this.introRemaining = remaining;

    for (const item of Object.values(this.items)) {
      item.start();
    }

    // subscribe to mouse events while running
    this.offMouseMove?.();  this.offMouseMove  = undefined;

    const store = (this.engine as any).store as AppStore | undefined;
    if (store) {
      this.offMouseMove = store.onEffect("on", "mousemove",
        (payload: AppAM["on"]["mousemove"]) => this.handleMouseMove(payload));
    }

    // if there are no intro items on (re)start, emit completion immediately
    if (this.introRemaining === 0 && !this.firedIntroComplete) {
      this.firedIntroComplete = true;
      (this.engine as any).store?.dispatch("logo", "introComplete", {});
    }
  }

  stop(): void {
    if (!this._isEnabled) return;

    this._isEnabled = false;
    for (const item of Object.values(this.items)) {
      item.stop();
    }

    // unsubscribe when stopped
    this.offMouseMove?.();  this.offMouseMove  = undefined;
  }

  pause(): void {
    for (const item of Object.values(this.items)) { 
      item.pause();
    }
  }

  loop(dt: number, now: number): void {
    if (!this._isEnabled) return;

    const updates: XYRUpdate[] = [];
    let finishedNow = 0;

    for (const item of Object.values(this.items)) {
      const u = item.loop(dt, now);
      if (u) {
        updates.push(u);

        // @ts-expect-error this is a runtime prop
        if (u.__justFinishedIntro__) {
          finishedNow++;
        };
      }
    }

    const store = (this.engine as any).store as AppStore | undefined;

    if (updates.length > 0) {
      store?.dispatch("logo", "batchUpdate", { changes: updates });

      // keep quadtree fresh
      this.quadtree.clear();
      for (const item of Object.values(this.items)) {
        this.quadtree.insert(item as Circle);
      }

      if (finishedNow > 0) {
        this.introRemaining = Math.max(0, this.introRemaining - finishedNow);

        store?.dispatch("logo", "introProgress", {
          remaining: this.introRemaining,
          total: this.introTotal,
        });
      }
    }

    // fire completion even if no updates were emitted this frame
    if (this.introRemaining === 0 && !this.firedIntroComplete) {
      this.firedIntroComplete = true;

      store?.dispatch("logo", "introComplete", {});
    }
  }

  private handleMouseMove = (pos: AppAM["on"]["mousemove"]) => {
    if (!this._isEnabled) return;

    const newPosition = pos as unknown as { x: number; y: number };
    this.mouse = newPosition;

    const affected = this.quadtree.queryCircle(newPosition.x, newPosition.y, 8);
    const updates: XYRUpdate[] = [];

    for (const item of affected) {
      const u = item.onMousemove(newPosition);
      if (u) updates.push(u);
    }

    if (updates.length > 0) {
      const store = (this.engine as any).store as AppStore | undefined;
      store?.dispatch("logo", "batchUpdate", { changes: updates });
    }
  };

  teardown(): void {
    this.offMouseMove?.();  this.offMouseMove  = undefined;

    for (const item of Object.values(this.items)) {
      item.teardown();
    }

    for (const k of Object.keys(this.items)) {
      delete this.items[k];
    }
  }
}
