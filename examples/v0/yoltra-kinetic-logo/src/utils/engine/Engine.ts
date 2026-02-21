import type { Unsubscribe } from "@yoltra/core";
import type { EngineConfig, EngineInstance, SimulationInstance } from "./types";
import type { AppStore } from "../../state/types";

export class Engine implements EngineInstance {
  readonly cfg: Required<EngineConfig>;
  readonly store: AppStore;

  simulation?: SimulationInstance;

  _running = false;

  private _lastNow: number | null = null;
  private _dt = 0;
  private _fps = 0;
  private _handle: number | null = null;
  private _fpsRing: number[];
  private _fpsIdx = 0;
  private _fpsCount = 0;
  private _lastFpsEmit = 0;
  private _lastFpsReported = 0;
  private _rafGen = 0;

  private _offStop!: Unsubscribe;
  private _offStart!: Unsubscribe;

  constructor(cfg: EngineConfig = {}, store: AppStore) {
    this.cfg = {
      targetFPS: cfg.targetFPS ?? 60,
      maxDeltaMs: cfg.maxDeltaMs ?? 66.7,
      timeScale: cfg.timeScale ?? 1,
      fpsSampleSize: cfg.fpsSampleSize ?? 30,
      autoStart: cfg.autoStart ?? false,
      simulation: cfg.simulation!,
    };
    this.store = store;
    this._fpsRing = new Array<number>(this.cfg.fpsSampleSize).fill(this.cfg.targetFPS);
  }

  get lastNow(): number | null { return this._lastNow; }
  get dt(): number { return this._dt; }
  get fps(): number { return this._fps; }

  attach(sim: SimulationInstance): void { this.simulation = sim; }

  init(): void {
    // Use Yoltra effects to toggle the engine from outside (e.g. a UI button).
    this._offStop = this.store.onEffect("pixel", "stop", () => this.stop());
    this._offStart = this.store.onEffect("pixel", "start", () => this.start());

    this.simulation?.init();
  }

  start(): void {
    if (!this.simulation || this._running) return;
    this._running = true;
    this._lastNow = null;
    this.simulation.start();
    const gen = ++this._rafGen;
    this._handle = requestAnimationFrame(t => this._tick(t, gen));
  }

  stop(): void {
    this._running = false;
    if (this._handle != null) { cancelAnimationFrame(this._handle); this._handle = null; }
    this._rafGen++; // invalidate any in-flight rAF callbacks
    this._lastNow = null;
    this.simulation?.stop();
  }

  pause(): void {
    if (!this._running && this._handle == null) return;
    if (this._handle != null) { cancelAnimationFrame(this._handle); this._handle = null; }
    this._running = false;
    this.simulation?.pause();
  }

  loop(dt: number, now: number): void {
    if (!this._running) return;
    this.simulation?.loop(dt, now);
  }

  teardown(): void {
    this.stop();
    this.simulation?.teardown();
    this.simulation = undefined;
    this._offStop?.();
    this._offStart?.();
  }

  private _tick(now: number, gen: number): void {
    if (!this.simulation || !this._running || gen !== this._rafGen) {
      this._handle = null;
      return;
    }

    // Compute clamped & scaled delta time.
    let dt = 0;
    if (this._lastNow != null) {
      dt = Math.min(now - this._lastNow, this.cfg.maxDeltaMs);
    }
    this._lastNow = now;
    const scaledDt = dt * this.cfg.timeScale;
    this._dt = scaledDt;

    // Rolling FPS average.
    if (dt > 0) {
      const instFps = 1000 / dt;
      this._fpsRing[this._fpsIdx] = instFps;
      this._fpsIdx = (this._fpsIdx + 1) % this._fpsRing.length;
      if (this._fpsCount < this._fpsRing.length) this._fpsCount++;
      const sum = this._fpsRing.reduce((a, b) => a + b, 0);
      this._fps = sum / this._fpsCount;

      // Emit to store at ~4 Hz, only when the rounded value actually changed.
      if (now - this._lastFpsEmit > 250) {
        this._lastFpsEmit = now;
        const rounded = Math.round(this._fps);
        if (rounded !== Math.round(this._lastFpsReported)) {
          this.store.emit("pixel", "fps", { fps: rounded });
          this._lastFpsReported = this._fps;
        }
      }

      this.simulation.loop(scaledDt, now);
    }

    // Schedule next frame only if still in the current run.
    if (this._running && gen === this._rafGen) {
      this._handle = requestAnimationFrame(t => {
        if (this._running && gen === this._rafGen) this._tick(t, gen);
      });
    } else {
      this._handle = null;
    }
  }
}
