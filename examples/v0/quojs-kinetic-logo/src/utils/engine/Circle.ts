import type { EngineInstance, SimulationItemInstance, SimulationItemSpec, XYRUpdate } from "./types";

import {
  doCirclesOverlap,
  stepOrbitWhileAvoiding,
  expApproach2D,
  nearly2D,
  nearly,
} from "..";
import { SimulationItem } from "./SimulationItem";

const size = 8;

export class Circle extends SimulationItem implements SimulationItemInstance {
  readonly type = "Circle" as const;

  intro = true;
  private _lastDt = 0.016; // seconds
  private _isEnabled = false;

  private _homeX: number;
  private _homeY: number;

  private _cooldownUntilMs = 0;
  private _halfLife = 0.25;

  group: "d" | "u" | "x";
  x: number;
  y: number;

  private static readonly POS_EPS = 0.02;
  private static readonly SNAP_POS = 0.10;

  constructor(engine: EngineInstance, spec: SimulationItemSpec) {
    super(engine, spec);
    const p = spec.params;

    this.group = p.group ?? "d";

    this.x = p.startX ?? 0;
    this.y = p.startY ?? 0;

    this._homeX = p.x ?? 0;
    this._homeY = p.y ?? 0;

    const factor = Math.max(0.001, p.factor ?? 4);
    this._halfLife = 1 / factor;

    const delaySec = Math.max(0, p.delay ?? 0.3);
    this._cooldownUntilMs = 0;
    this._setCooldown = (nowMs: number) => { this._cooldownUntilMs = nowMs + delaySec * 1000; };
  }

  private _setCooldown: (nowMs: number) => void = () => { };

  init(): void {}

  start() {
    this._isEnabled = true;
  }

  stop() {
    this._isEnabled = false;
  }

  pause() {}

  teardown(): void {}

  loop(dtMs: number, nowMs: number): XYRUpdate | void {
    if (!this.engine._running || !this._isEnabled) return;

    const sDt = Math.min(dtMs, 50) / 1000;
    this._lastDt = sDt;

    // handle intro animation
    if (this.intro) {
      return this._handleIntroState(sDt);
    }

    // handle post-intro behavior
    return this._handlePostIntroState(sDt, nowMs);
  }

  private _handleIntroState(sDt: number): XYRUpdate | void {
    const target = { x: this._homeX, y: this._homeY };

    // compute next
    const prev = { x: this.x, y: this.y };
    const next = expApproach2D(prev, target, sDt, this._halfLife);

    // ALWAYS commit internal position so we keep progressing every frame
    this.x = next.x;
    this.y = next.y;

    // if we're snap-close to home, snap + finish intro
    if (nearly2D(next, target, Circle.SNAP_POS)) {
      this._snapToHome();
      this.intro = false;

      return {
        group: this.group,
        id: this.id,
        x: this.x,
        y: this.y,
        __justFinishedIntro__: true
      };
    }

    // only emit if the delta is visually meaningful
    const movedVisually = !nearly2D(next, prev, Circle.POS_EPS);
    if (movedVisually) {
      return {
        group: this.group,
        id: this.id,
        x: this.x,
        y: this.y
      };
    }
    // else: no emit this frame, but we DID move internally → no stall
  }

  private _handlePostIntroState(sDt: number, nowMs: number): XYRUpdate | void {
    const inCooldown = nowMs < this._cooldownUntilMs;

    const mouse = (this.engine as any).simulation?.mouse ?? { x: 0, y: 0 };

    // if we're overlapping the mouse, onMousemove() will push us away.
    // here we only handle the relax-back-to-home when NOT overlapping.
    const overlapping = doCirclesOverlap(
      {
        x: this.x,
        y: this.y,
        r: (this as any).r ?? size
      },
      {
        x: mouse.x,
        y: mouse.y,
        r: (this as any).r ?? size
      },
    );

    if (overlapping) return;

    const target = { x: this._homeX, y: this._homeY };

    // if we're basicaly home, snap & finish.
    if (nearly2D({ x: this.x, y: this.y }, target, Circle.SNAP_POS)) {
      // guard to avoid redundant emits
      if (!nearly(this.x, this._homeX, Circle.SNAP_POS) || !nearly(this.y, this._homeY, Circle.SNAP_POS)) {
        this._snapToHome();

        return {
          group: this.group,
          id: this.id,
          x: this.x,
          y: this.y
        };
      }

      return;
    }

    // Ease back to home. Optionally temper speed during cooldown.
    const halfLife = inCooldown ? this._halfLife * 1.5 : this._halfLife; // slower while cooling down
    const next = expApproach2D({ x: this.x, y: this.y }, target, sDt, halfLife);
    const moved = !nearly2D(next, { x: this.x, y: this.y }, Circle.POS_EPS);

    this.x = next.x; this.y = next.y;
    if (moved) {
      return {
        group: this.group,
        id: this.id,
        x: this.x,
        y: this.y
      };
    }
  }

  onMousemove(mousePosition: { x: number; y: number }): XYRUpdate | void {
    if (!this.engine._running || !this._isEnabled) return;

    const { x, y } = stepOrbitWhileAvoiding(
      { x: this.x, y: this.y },
      mousePosition,
      size,
      this._lastDt,
    );

    if (!nearly2D({ x, y }, { x: this.x, y: this.y }, Circle.POS_EPS)) {
      this.x = x;
      this.y = y;
      this._setCooldown(typeof performance !== "undefined" ? performance.now() : Date.now());

      return {
        group: this.group,
        id: this.id,
        x: this.x,
        y: this.y,
      };
    }
  }

  // Helper methods for state handling...
  _hasReachedHome(target: { x: number; y: number }): boolean {
    return nearly2D({ x: this.x, y: this.y }, target, Circle.SNAP_POS);
  }

  _snapToHome(): void {
    this.x = this._homeX;
    this.y = this._homeY;
  }
}
