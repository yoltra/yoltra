import { doCirclesOverlap, expApproach2D, nearly2D, stepOrbitWhileAvoiding } from "..";
import { liveConfig } from "../../config";
import { SimulationItem } from "./SimulationItem";
import type { DotItemSpec, EngineInstance, XYUpdate } from "./types";

/** Visual radius for overlap detection (SVG user units). */
const DOT_RADIUS = 2;

export class DotItem extends SimulationItem {
  private _homeX: number;
  private _homeY: number;
  /** Base half-life in seconds (1 / factor). Scaled at runtime by liveConfig.speedMultiplier. */
  private _baseHalfLife: number;
  private _cooldownUntilMs = 0;
  private _isEnabled = false;

  /** Last dt fed to loop(); used by onMousemove() between frames. */
  private _lastDt = 0.016;

  private static readonly POS_EPS = 0.08;
  private static readonly SNAP_EPS = 0.15;

  constructor(engine: EngineInstance, spec: DotItemSpec) {
    super(engine, spec);
    const p = spec.params;
    this.x = p.startX;
    this.y = p.startY;
    this._homeX = p.x;
    this._homeY = p.y;
    this._baseHalfLife = 1 / Math.max(0.001, p.factor);
  }

  override start(): void { this._isEnabled = true; }
  override stop(): void  { this._isEnabled = false; }

  override loop(dtMs: number, nowMs: number): XYUpdate | void {
    if (!this.engine._running || !this._isEnabled) return;
    const dt = Math.min(dtMs, 50) / 1000;
    this._lastDt = dt;
    return this.intro ? this._introStep(dt) : this._idleStep(dt, nowMs);
  }

  override onMousemove(mouse: { x: number; y: number }): XYUpdate | void {
    if (!this.engine._running || !this._isEnabled) return;

    // Read interact radius live from config so the slider takes effect immediately.
    const ir = liveConfig.interactRadius;

    const next = stepOrbitWhileAvoiding({ x: this.x, y: this.y }, mouse, ir, this._lastDt);

    if (!nearly2D(next, { x: this.x, y: this.y }, DotItem.POS_EPS)) {
      this.x = next.x;
      this.y = next.y;
      this._cooldownUntilMs =
        (typeof performance !== "undefined" ? performance.now() : Date.now()) + 300;
      return { id: this.id, x: this.x, y: this.y, color: this.color };
    }
  }

  // ── private ──────────────────────────────────────────────────────────────

  private _halfLife(): number {
    // speedMultiplier > 1 → smaller effective half-life → faster convergence.
    return this._baseHalfLife / Math.max(0.01, liveConfig.speedMultiplier);
  }

  private _introStep(dt: number): XYUpdate | void {
    const home = { x: this._homeX, y: this._homeY };
    const prev = { x: this.x, y: this.y };
    const next = expApproach2D(prev, home, dt, this._halfLife());

    this.x = next.x;
    this.y = next.y;

    if (nearly2D(next, home, DotItem.SNAP_EPS)) {
      this.x = this._homeX;
      this.y = this._homeY;
      this.intro = false;
      return { id: this.id, x: this.x, y: this.y, color: this.color, __justFinishedIntro__: true };
    }

    if (!nearly2D(next, prev, DotItem.POS_EPS)) {
      return { id: this.id, x: this.x, y: this.y, color: this.color };
    }
  }

  private _idleStep(dt: number, nowMs: number): XYUpdate | void {
    const mouse = this.engine.simulation?.mouse ?? { x: -9999, y: -9999 };
    const ir = liveConfig.interactRadius;

    const overlapping = doCirclesOverlap(
      { x: this.x, y: this.y, r: DOT_RADIUS },
      { x: mouse.x, y: mouse.y, r: ir },
    );
    if (overlapping) return;

    const home = { x: this._homeX, y: this._homeY };

    if (nearly2D({ x: this.x, y: this.y }, home, DotItem.SNAP_EPS)) {
      if (this.x !== this._homeX || this.y !== this._homeY) {
        this.x = this._homeX;
        this.y = this._homeY;
        return { id: this.id, x: this.x, y: this.y, color: this.color };
      }
      return;
    }

    const inCooldown = nowMs < this._cooldownUntilMs;
    const hl = inCooldown ? this._halfLife() * 1.5 : this._halfLife();
    const prev = { x: this.x, y: this.y };
    const next = expApproach2D(prev, home, dt, hl);
    const moved = !nearly2D(next, prev, DotItem.POS_EPS);

    this.x = next.x;
    this.y = next.y;

    if (moved) {
      return { id: this.id, x: this.x, y: this.y, color: this.color };
    }
  }
}
