import { randomPointInCircle, rgbaToHex, toImageData, type ImageSource } from "..";
import type { DotItemSpec } from "../engine/types";

export type ExtractOptions = {
  /**
   * Maximum number of dots to produce.
   * Reservoir sampling guarantees a uniform spatial distribution
   * regardless of pixel density. Default 1000. */
  maxDots?: number;

  /**
   * Grid stride: only pixels at `(x % stride === 0, y % stride === 0)` are
   * considered candidates. stride=1 → every pixel; stride=2 → ¼ of pixels, etc.
   * The reservoir sample then selects `maxDots` from those candidates.
   * Default 1. */
  stride?: number;

  /**
   * Pixels with alpha ≤ this value are treated as transparent. Default 1. */
  minAlpha?: number;

  /**
   * Approch speed multiplier per dot.
   * Returns a factor in [minFactor, maxFactor]; half-life ≈ 1/factor s.
   * Default: uniform random in [3, 7]. */
  factor?: () => number;

  /**
   * Intro animation delay in seconds.
   * Default: uniform random in [0, 0.8]. */
  delay?: () => number;
};

export type ExtractResult = {
  specs: DotItemSpec[];
  width: number;
  height: number;
};

/**
 * Extract up to `maxDots` dots from a transparent PNG (or any RGBA source).
 *
 * ## Algorithm
 *
 * 1. **Scan** every pixel; collect all non-transparent ones.
 * 2. **Reservoir-sample** down to `maxDots` — guarantees a visually
 *    uniform, unbiased subset regardless of image density.
 * 3. **Convert** each sample into a `DotItemSpec` with:
 *    - `color` from the source pixel (hex, e.g. "#3A7BD5")
 *    - `x/y` = pixel coordinate (the "home" position)
 *    - `startX/startY` = random point scattered ~1.5× the image diagonal
 *      away from home, so dots appear to fly in from all directions. */
export function extractDotSpecsFromImage(
  source: ImageSource,
  opts: ExtractOptions = {},
): ExtractResult {
  const {
    maxDots = 1000,
    stride = 1,
    minAlpha = 1,
    factor = () => 3 + Math.random() * 4,
    delay = () => Math.random() * 0.8,
  } = opts;

  const img = toImageData(source);
  const { width, height, data } = img;

  // ── Phase 1: collect visible pixels on a stride grid ─────────────────────
  // stride=1 → every pixel; stride=2 → every other pixel in both axes (¼ density)
  type PixelInfo = { x: number; y: number; r: number; g: number; b: number };
  const pixels: PixelInfo[] = [];
  const s = Math.max(1, Math.round(stride));

  for (let y = 0; y < height; y += s) {
    for (let x = 0; x < width; x += s) {
      const i = (y * width + x) * 4;
      if (data[i + 3] <= minAlpha) continue;
      pixels.push({ x, y, r: data[i], g: data[i + 1], b: data[i + 2] });
    }
  }

  // ── Phase 2: reservoir sample ─────────────────────────────────────────────
  // Uses Algorithm R (Vitter 1985): O(N) time, O(k) memory, truly uniform.
  const sampled = reservoirSample(pixels, maxDots);

  // ── Phase 3: convert to specs ─────────────────────────────────────────────
  // Scatter start positions around the image in a large circle so the
  // fly-in animation comes from all directions simultaneously.
  const scatterRadius = Math.hypot(width, height) * 7;

  const specs: DotItemSpec[] = sampled.map((p, i) => {
    const [startX, startY] = randomPointInCircle(width / 2, height / 2, scatterRadius);

    return {
      id: `dot_${i}`,
      type: "Dot",
      params: {
        color: rgbaToHex(p.r, p.g, p.b),
        x: p.x,
        y: p.y,
        r: 1,
        startX,
        startY,
        delay: delay(),
        factor: factor(),
      },
    };
  });

  return { specs, width, height };
}

// ---------------------------------------------------------------------------
// Algorithm R reservoir sample — uniform, unbiased, O(N)
// ---------------------------------------------------------------------------

function reservoirSample<T>(arr: T[], k: number): T[] {
  if (arr.length <= k) return arr.slice();

  // Fill the reservoir with the first k items.
  const reservoir = arr.slice(0, k);

  for (let i = k; i < arr.length; i++) {
    const j = Math.floor(Math.random() * (i + 1));
    if (j < k) reservoir[j] = arr[i];
  }

  return reservoir;
}
