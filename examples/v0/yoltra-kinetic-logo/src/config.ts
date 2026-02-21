// ---------------------------------------------------------------------------
// Live config — mutated in place by the ConfigPanel.
// DotItem and Simulation read these every frame/event, so changes
// take effect immediately without restarting the simulation.
// ---------------------------------------------------------------------------

export const liveConfig = {
  /** Mouse repel radius in SVG user-space pixels. */
  interactRadius: 8,

  /**
   * Multiplier applied to every dot's half-life.
   * 1 = original speed, 2 = twice as fast, 0.5 = half speed. */
  speedMultiplier: 1,
};

// ---------------------------------------------------------------------------
// Extraction config — changes require restarting the simulation.
// ---------------------------------------------------------------------------

export type ExtractionConfig = {
  /**
   * Maximum number of dots after reservoir sampling. */
  maxDots: number;

  /**
   * Grid stride for the pixel scan: only pixels at positions where
   * `(x % stride === 0) && (y % stride === 0)` are considered.
   * stride=1 → every pixel, stride=2 → every other pixel (¼ density), etc.
   * The reservoir sample then selects `maxDots` from those candidates. */
  stride: number;

  /**
   * Minimum alpha for a pixel to be considered visible (0–255).
   * Lower → more semi-transparent edge pixels become dots. */
  minAlpha: number;
};

export const DEFAULT_EXTRACTION_CONFIG: ExtractionConfig = {
  maxDots: 3000,
  stride: 1,
  minAlpha: 1,
};

// ---------------------------------------------------------------------------
// Visual defaults (applied via CSS variable, not Yoltra state)
// ---------------------------------------------------------------------------

/** Default dot visual radius in CSS px. Controlled by --dot-radius. */
export const DEFAULT_DOT_RADIUS_PX = 1.5;
