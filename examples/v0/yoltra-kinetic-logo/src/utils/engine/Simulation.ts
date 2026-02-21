import type { Unsubscribe } from "@yoltra/core";
import type { AppEM, AppStore } from "../../state/types";
import type { EngineInstance, SimulationConfig, SimulationInstance, XYUpdate } from "./types";
import { liveConfig } from "../../config";
import { DotItem } from "./DotItem";
import { QuadTree } from "../Quadtree";

export class Simulation implements SimulationInstance {
  readonly name?: string;
  readonly engine: EngineInstance;
  readonly items: Record<string, DotItem> = Object.create(null);

  mouse: { x: number; y: number } = { x: -9999, y: -9999 };

  private readonly cfg: SimulationConfig;
  private _itemList: DotItem[] = [];
  private _isEnabled = false;
  private _introRemaining = 0;
  private _introTotal = 0;
  private _introCompleteFired = false;
  private _offMouseMove?: Unsubscribe;

  quadtree: QuadTree<DotItem>;

  constructor(engine: EngineInstance, cfg: SimulationConfig) {
    this.engine = engine;
    this.cfg = cfg;
    this.name = cfg.name;
    // Quadtree bounds are extended generously to accommodate off-screen
    // start positions without clipping items during the intro fly-in.
    this.quadtree = new QuadTree<DotItem>({ x: -3000, y: -3000, width: 9000, height: 9000 });
  }

  init(): void {
    const store = this._store();

    // Build item pool.
    for (const spec of this.cfg.items) {
      const item = new DotItem(this.engine, spec);
      this.items[spec.id] = item;
      this._itemList.push(item);
    }

    // Count how many need to fly in.
    this._introTotal = this._itemList.length;
    this._introRemaining = this._itemList.filter(i => i.intro).length;

    store?.emit("pixel", "introProgress", {
      remaining: this._introRemaining,
      total: this._introTotal,
    });

    // Pre-populate state with initial positions (random start positions).
    // This means React components find data on first render, avoiding
    // a frame of 0,0 fallback positions.
    const initialBatch = this._itemList.map(item => ({
      id: item.id,
      x: item.x,
      y: item.y,
      color: item.color,
    }));
    if (initialBatch.length > 0) {
      store?.emit("pixel", "batchUpdate", { changes: initialBatch });
    }

    // Build initial quadtree.
    for (const item of this._itemList) {
      this.quadtree.insert(item);
      item.init();
    }
  }

  start(): void {
    if (this._isEnabled) return;
    this._isEnabled = true;
    this._introCompleteFired = false;

    // Recount in case items were reset externally.
    this._introRemaining = this._itemList.filter(i => i.intro).length;

    for (const item of this._itemList) item.start();

    // Subscribe to mouse events only while running.
    this._offMouseMove?.();
    this._offMouseMove = this._store()?.onEffect(
      "on", "mousemove",
      (payload: AppEM["on"]["mousemove"]) => this._handleMouseMove(payload)
    );

    // If no intro items, complete immediately.
    if (this._introRemaining === 0 && !this._introCompleteFired) {
      this._introCompleteFired = true;
      this._store()?.emit("pixel", "introComplete", {});
    }
  }

  stop(): void {
    if (!this._isEnabled) return;
    this._isEnabled = false;
    this._offMouseMove?.(); this._offMouseMove = undefined;
    for (const item of this._itemList) item.stop();
  }

  pause(): void {
    for (const item of this._itemList) item.pause();
  }

  loop(dtMs: number, now: number): void {
    if (!this._isEnabled) return;

    const updates: XYUpdate[] = [];
    let finishedNow = 0;

    for (const item of this._itemList) {
      const u = item.loop(dtMs, now);
      if (u) {
        updates.push(u);
        if (u.__justFinishedIntro__) finishedNow++;
      }
    }

    if (updates.length > 0) {
      const store = this._store();
      store?.emit("pixel", "batchUpdate", { changes: updates });

      // Refresh quadtree from the pre-allocated flat list — no Object.values() allocation.
      this.quadtree.clear();
      for (const item of this._itemList) this.quadtree.insert(item);

      if (finishedNow > 0) {
        this._introRemaining = Math.max(0, this._introRemaining - finishedNow);
        store?.emit("pixel", "introProgress", {
          remaining: this._introRemaining,
          total: this._introTotal,
        });
      }
    }

    // Fire completion even if nothing moved this frame.
    if (this._introRemaining === 0 && !this._introCompleteFired) {
      this._introCompleteFired = true;
      this._store()?.emit("pixel", "introComplete", {});
    }
  }

  teardown(): void {
    this._offMouseMove?.(); this._offMouseMove = undefined;
    for (const item of this._itemList) item.teardown();
    this._itemList.length = 0;
    for (const k of Object.keys(this.items)) delete this.items[k];
  }

  private _handleMouseMove = (pos: { x: number; y: number }): void => {
    if (!this._isEnabled) return;
    this.mouse = pos;

    const affected = this.quadtree.queryCircle(pos.x, pos.y, liveConfig.interactRadius);
    if (!affected.length) return;

    const updates: XYUpdate[] = [];
    for (const item of affected) {
      const u = item.onMousemove(pos);
      if (u) updates.push(u);
    }

    if (updates.length > 0) {
      this._store()?.emit("pixel", "batchUpdate", { changes: updates });
    }
  };

  private _store(): AppStore | undefined {
    return this.engine.store;
  }
}
