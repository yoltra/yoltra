import type { Unsubscribe } from "@quojs/core";
import type { EngineConfig, EngineInstance, SimulationInstance } from "./types";
import type { AppStore } from "../../state/types";
import { Simulation } from "./Simulation";

export class Engine implements EngineInstance {
  public readonly cfg: Required<EngineConfig>;
  public readonly store!: AppStore;

  public simulation?: SimulationInstance;

  _running = false;
  private _lastNow: number | null = null;
  private _dt = 0;
  private _fps = 0;
  private _handle: number | null = null;
  private _fpsRing: number[];
  private _fpsIdx = 0;
  private _fpsCount = 0;
  private _lastFpsEmit = 0;
  private _lastFps: number = 0;
  private _rafGen = 0;

  private offSimToggleStart!: Unsubscribe;
  private offSimToggleStop!: Unsubscribe;

  constructor(cfg: EngineConfig = {}, store: AppStore) {
    this.cfg = {
      targetFPS: cfg.targetFPS ?? 60,
      maxDeltaMs: cfg.maxDeltaMs ?? 66.7,
      timeScale: cfg.timeScale ?? 1,
      fpsSampleSize: cfg.fpsSampleSize ?? 30,
      autoStart: cfg.autoStart ?? false,
      simulation: cfg.simulation!,
    };

    if (cfg.simulation) {
      this.cfg.simulation = cfg.simulation;
    }

    this.store = store;
    this._fpsRing = new Array(this.cfg.fpsSampleSize).fill(this.cfg.targetFPS);

    if (this.cfg.simulation) {
      this.simulation = new Simulation(this, this.cfg.simulation);
      if (this.cfg.autoStart) this.start();
    }

    this.start = this.start.bind(this);
    this.stop = this.stop.bind(this);
    this.pause = this.pause.bind(this);
    this.loop = this.loop.bind(this);
    this.teardown = this.teardown.bind(this);
  }

  get running() {
    return this._running;
  }

  get lastNow() {
    return this._lastNow;
  }

  get dt() {
    return this._dt;
  }

  get fps() {
    return this._fps;
  }

  attach(sim: SimulationInstance): void { this.simulation = sim; }

  init(): void {
    this.offSimToggleStop = this.store.onEffect("logo", "stop", () => this.stop());
    this.offSimToggleStart = this.store.onEffect("logo", "start", () => this.start());

    this.simulation?.init();
  }

  start(): void {
    if (!this.simulation || this._running) return;

    this._running = true;
    this._lastNow = null;
    this.simulation.start();

    const gen = ++this._rafGen; // new generation
    this._handle = requestAnimationFrame((t) => this._tick(t, gen));
  }

  stop(): void {
    // flip first so any in-flight tick can see it
    this._running = false;

    if (this._handle != null) {
      cancelAnimationFrame(this._handle);
      this._handle = null;
    }

    // kill any stale callbacks that might still arrive
    this._rafGen++;

    this._lastNow = null;
    this.simulation?.stop();
  }

  pause(): void {
    if (!this._running && this._handle == null) return;
    if (this._handle != null) {
      cancelAnimationFrame(this._handle);
      this._handle = null;
    }

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

    this.offSimToggleStart?.();
    this.offSimToggleStop?.();
  }

  // note: carry generation token through RAF chain
  private _tick(now: number, gen: number) {
    if (!this.simulation || !this._running || gen !== this._rafGen) {
      this._handle = null;

      return;
    }

    // dt (ms) with clamp + timeScale
    let dt = 0;
    if (this._lastNow != null) {
      dt = now - this._lastNow;

      if (dt > this.cfg.maxDeltaMs) {
        dt = this.cfg.maxDeltaMs;
      }
    }
    this._lastNow = now;

    const scaled = dt * this.cfg.timeScale;
    this._dt = scaled;

    // fps smoothing + report ~4Hz
    if (dt > 0) {
      const instFps = 1000 / dt;

      this._fpsRing[this._fpsIdx] = instFps;
      this._fpsIdx = (this._fpsIdx + 1) % this._fpsRing.length;
      if (this._fpsCount < this._fpsRing.length) {
        this._fpsCount++;
      }

      const sum = this._fpsRing.slice(0, this._fpsCount).reduce((a, b) => a + b, 0);
      this._fps = sum / this._fpsCount;

      if (now - this._lastFpsEmit > 250) {
        this._lastFpsEmit = now;
        const lastFpsRounded = Math.round(this._lastFps);
        const newFpsRounded = Math.round(this._fps);

        if ( lastFpsRounded !== newFpsRounded) { // do not flod Quo with same fps
          this.store.emit("logo", "fps", { fps: newFpsRounded });

          this._lastFps = this._fps;
        }
      }
    }

    if (dt > 0) this.simulation.loop(this._dt, now);

    // schedule next frame only if still current run
    if (this._running && gen === this._rafGen) {
      this._handle = requestAnimationFrame((t) => {
        // just make sure we don't re-enter...
        if (this._running && gen === this._rafGen) {
          this._tick(t, gen);
        }
      })
    } else {
      this._handle = null;
    }
  }
}