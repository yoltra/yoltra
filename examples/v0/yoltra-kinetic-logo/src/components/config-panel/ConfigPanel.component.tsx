import { useState } from "react";

import {
  liveConfig,
  DEFAULT_DOT_RADIUS_PX,
  DEFAULT_EXTRACTION_CONFIG,
  type ExtractionConfig,
} from "../../config";

import "./ConfigPanel.style.css";

interface ConfigPanelProps {
  /** Called when the user clicks "Restart Simulation" with the new config. */
  onRestart: (cfg: ExtractionConfig) => void;
}

// ---------------------------------------------------------------------------
// Slider — tiny helper to reduce repetition.
// ---------------------------------------------------------------------------

interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit?: string;
  onChange: (v: number) => void;
}

function Slider({ label, value, min, max, step, unit = "", onChange }: SliderProps) {
  const display = Number.isInteger(step) ? value.toFixed(0) : value.toFixed(1);
  return (
    <div className="config-row">
      <label>{label}</label>
      <span className="value">{display}{unit}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// ConfigPanel
// ---------------------------------------------------------------------------

export function ConfigPanel({ onRestart }: ConfigPanelProps) {
  const [open, setOpen] = useState(false);

  // ── Visual (live, via CSS variable) ──────────────────────────────────────
  const [radius, setRadius] = useState(DEFAULT_DOT_RADIUS_PX);

  // ── Physics (live, via liveConfig singleton) ──────────────────────────────
  const [speedMultiplier, setSpeedMultiplier] = useState(liveConfig.speedMultiplier);
  const [interactRadius, setInteractRadius] = useState(liveConfig.interactRadius);

  // ── Extraction (pending — applied on restart) ──────────────────────────────
  const [maxDots, setMaxDots] = useState(DEFAULT_EXTRACTION_CONFIG.maxDots);
  const [stride, setStride] = useState(DEFAULT_EXTRACTION_CONFIG.stride);
  const [minAlpha, setMinAlpha] = useState(DEFAULT_EXTRACTION_CONFIG.minAlpha);

  // Live handlers — take effect immediately without restarting.

  const handleRadius = (v: number) => {
    setRadius(v);
    document.documentElement.style.setProperty("--dot-radius", `${v}px`);
  };

  const handleSpeed = (v: number) => {
    setSpeedMultiplier(v);
    liveConfig.speedMultiplier = v;
  };

  const handleInteract = (v: number) => {
    setInteractRadius(v);
    liveConfig.interactRadius = v;
  };

  const handleRestart = () => {
    onRestart({ maxDots, stride, minAlpha });
  };

  return (
    <div className="config-panel">
      <button className="config-panel__toggle" onClick={() => setOpen(o => !o)}>
        ⚙ Config {open ? "▲" : "▼"}
      </button>

      {open && (
        <div className="config-panel__body">

          {/* ── Visual ──────────────────────────────────────────── */}
          <div className="config-section">
            <h4>Visual</h4>
            <Slider
              label="Dot radius"
              value={radius}
              min={0.5} max={6} step={0.5}
              unit="px"
              onChange={handleRadius}
            />
          </div>

          {/* ── Physics (live) ───────────────────────────────────── */}
          <div className="config-section">
            <h4>Physics · live</h4>
            <Slider
              label="Return speed"
              value={speedMultiplier}
              min={0.2} max={4} step={0.1}
              unit="×"
              onChange={handleSpeed}
            />
            <Slider
              label="Repel radius"
              value={interactRadius}
              min={2} max={60} step={1}
              unit="px"
              onChange={handleInteract}
            />
          </div>

          {/* ── Sampling (requires restart) ──────────────────────── */}
          <div className="config-section">
            <h4>Sampling · needs restart</h4>
            <Slider
              label="Max dots"
              value={maxDots}
              min={100} max={5000} step={100}
              onChange={setMaxDots}
            />
            <Slider
              label="Pixel stride"
              value={stride}
              min={1} max={8} step={1}
              onChange={setStride}
            />
            <p className="config-note">
              stride {stride} → sample 1 of every {stride * stride} pixel{stride > 1 ? "s" : ""}
            </p>
            <Slider
              label="Min alpha"
              value={minAlpha}
              min={0} max={200} step={1}
              onChange={setMinAlpha}
            />
            <button className="config-restart-btn" onClick={handleRestart}>
              ↺ Restart simulation
            </button>
          </div>

        </div>
      )}
    </div>
  );
}
