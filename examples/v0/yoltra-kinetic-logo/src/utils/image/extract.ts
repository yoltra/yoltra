import type { CircleSpec } from "../engine/types";
import { getRandomInt, randomPointInCircle, rgbaToHex, toImageData, type ImageSource } from "..";
import { randomHexColor } from "./randomHex";

export type ExtractOptions = {
  /**
   * sample every N pixels (grid stride). Typical: 3–6 */
  spacing: number;

  /**
   * alpha threshold (0–255). Only pixels with alpha > minAlpha are kept */
  minAlpha?: number;

  /**
   * random jitter added to each sample point to kill grid artifacts (px) */
  jitter?: number;

  /**
   * initial radius for each circle (px) */
  initialR?: number;

  /**
   * optional velocity generator; default vx=vy=0 */
  factor?: (x: number, y: number, rgba: [number, number, number, number]) => number;

  /**
   * delay generator in seconds; default 0..0.6s */
  delay?: (x: number, y: number, i: number, rgba: [number, number, number, number]) => number;

  /**
   * maximum number of circles (after filtering), for safety */
  maxCircles: number;
};

/**
 * extract CircleSpec[] from a transparent PNG (or any RGBA source).
 * keeps pixel color/x/y, groups by x-thirds (d/u/x), samples on a stride grid */
export function extractCircleSpecsFromImage(
  source: ImageSource,
  opts: ExtractOptions
): { specs: CircleSpec[]; width: number; height: number, groupCounts: { d: number, u: number, x: number } } {
  const {
    spacing,
    minAlpha = 16,
    jitter = 0.0,
    initialR = 1.0,
    maxCircles,
    delay = (_x, _y, _i, _rgba) => Math.random() * 1, // 0..0.6s
    factor = (_x, _y, _rgba) => 6,                    // half-life ~= 1/factor
  } = opts;

  const img = toImageData(source);
  const { width, height, data } = img;

  const third = width / 3.1;
  const rnd = (n: number) => (Math.random() - 0.5) * n;

  const specs: CircleSpec[] = [];
  const groupCounts = { d: 0, u: 0, x: 0 };

  // early-out if already full
  const pushIfRoom = (s: CircleSpec, g: "d" | "u" | "x") => {
    if (groupCounts[g] >= maxCircles) return false;

    specs.push(s);
    groupCounts[g]++;

    return true;
  };

  for (let y = 0; y < height; y += spacing) {
    for (let x = 0; x < width; x += spacing) {
      const xi = Math.max(0, Math.min(width - 1, Math.round(x + (jitter ? rnd(jitter) : 0))));
      const yi = Math.max(0, Math.min(height - 1, Math.round(y + (jitter ? rnd(jitter) : 0))));
      const idx = (yi * width + xi) * 4;
      const r = data[idx + 0];
      const g = data[idx + 1];
      const b = data[idx + 2];
      const a = data[idx + 3];

      if (a <= minAlpha) continue;

      const group: "d" | "u" | "x" = xi < third ? "d" : xi < 2 * third ? "u" : "x";
      const color = rgbaToHex(r, g, b);
      const [startX, startY] = randomPointInCircle(xi, yi, 2000);

      const dly = delay(xi, yi, specs.length, [r, g, b, a]);
      const fac = factor(xi, yi, [r, g, b, a]);

      const spec: CircleSpec = {
        id: `circle_${group}_${groupCounts[group]}`,
        type: "Circle",
        params: {
          group,
          color,
          x: xi,
          y: yi,
          r: initialR,

          // intro state
          startX: startX,
          startY: startY,
          startR: getRandomInt(1, 3),
          startColor: randomHexColor(),

          // behavior
          delay: dly,       // seconds
          factor: fac,      // maps to half-life = 1/factor
        },
      };

      if (!pushIfRoom(spec, group)) break;
    }
  }

  return { specs, width, height, groupCounts };
}
