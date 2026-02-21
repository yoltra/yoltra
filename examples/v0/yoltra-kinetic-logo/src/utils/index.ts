// ---------------------------------------------------------------------------
// Coordinate helpers
// ---------------------------------------------------------------------------

export function eventToSvgUserCoords(
  event: React.MouseEvent<SVGSVGElement> | React.PointerEvent<SVGSVGElement>,
  svgEl: SVGSVGElement
): { x: number; y: number } {
  const matrix = svgEl.getScreenCTM();
  if (!matrix) return { x: 0, y: 0 };
  const point = new DOMPoint(event.clientX, event.clientY);
  const svgPoint = point.matrixTransform(matrix.inverse());
  return { x: svgPoint.x, y: svgPoint.y };
}

// ---------------------------------------------------------------------------
// Random helpers
// ---------------------------------------------------------------------------

export function getRandomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (Math.floor(max) - Math.ceil(min) + 1)) + Math.ceil(min);
}

/**
 * Uniform random point inside a circle of radius `r` centered at (cx, cy).
 * Uses sqrt for a uniform area distribution (not polar-biased). */
export function randomPointInCircle(cx: number, cy: number, r: number): [number, number] {
  const angle = Math.random() * 2 * Math.PI;
  const dist = r * Math.sqrt(Math.random());
  return [cx + dist * Math.cos(angle), cy + dist * Math.sin(angle)];
}

// ---------------------------------------------------------------------------
// Physics
// ---------------------------------------------------------------------------

type Point = { x: number; y: number };

/**
 * Frame-rate independent exponential approach.
 * Moves `current` toward `target` with the given `halfLifeSeconds`. */
export function expApproach(
  current: number,
  target: number,
  dtSeconds: number,
  halfLifeSeconds: number
): number {
  if (halfLifeSeconds <= 0) return target;
  return target + (current - target) * Math.pow(0.5, dtSeconds / halfLifeSeconds);
}

export function expApproach2D(
  curr: Point,
  tgt: Point,
  dtSeconds: number,
  halfLifeSeconds: number
): Point {
  return {
    x: expApproach(curr.x, tgt.x, dtSeconds, halfLifeSeconds),
    y: expApproach(curr.y, tgt.y, dtSeconds, halfLifeSeconds),
  };
}

export function nearly(a: number, b: number, eps = 0.01): boolean {
  return Math.abs(a - b) <= eps;
}

export function nearly2D(a: Point, b: Point, eps = 0.01): boolean {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return dx * dx + dy * dy <= eps * eps;
}

export function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v;
}

export function doCirclesOverlap(
  a: { x: number; y: number; r: number },
  b: { x: number; y: number; r: number }
): boolean {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const rSum = a.r + b.r;
  return dx * dx + dy * dy <= rSum * rSum;
}

/**
 * Move point `a` one simulation step so it orbits/avoids point `b`.
 * Combines a spring-like radial push (when too close) with a constant
 * tangential orbit velocity. */
export function stepOrbitWhileAvoiding(
  a: Point,
  b: Point,
  avoidRadius: number,
  dt: number,
  options: {
    radialGain?: number;
    tangentialSpeed?: number;
    maxSpeed?: number;
    clockwise?: boolean;
  } = {}
): Point {
  const {
    radialGain = 32.0,
    tangentialSpeed = 32,
    maxSpeed = 75,
    clockwise = true,
  } = options;

  let dx = a.x - b.x;
  let dy = a.y - b.y;
  let dist = Math.hypot(dx, dy);

  if (dist < 1e-6) { dx = 1; dy = 0; dist = 1; }

  const ux = dx / dist;
  const uy = dy / dist;

  // Tangent (90° rotation of radial unit vector).
  const tx = clockwise ? uy : -uy;
  const ty = clockwise ? -ux : ux;

  const penetration = Math.max(0, avoidRadius - dist);
  let vx = radialGain * penetration * ux + tangentialSpeed * tx;
  let vy = radialGain * penetration * uy + tangentialSpeed * ty;

  const speed = Math.hypot(vx, vy);
  if (speed > maxSpeed) { const s = maxSpeed / speed; vx *= s; vy *= s; }

  return { x: a.x + vx * dt, y: a.y + vy * dt };
}

// ---------------------------------------------------------------------------
// Color helpers
// ---------------------------------------------------------------------------

export function rgbaToHex(r: number, g: number, b: number): string {
  const h = (n: number) => n.toString(16).padStart(2, "0");
  return `#${h(r)}${h(g)}${h(b)}`.toUpperCase();
}

export type ImageSource = HTMLImageElement | ImageBitmap | ImageData;

export function toImageData(src: ImageSource): ImageData {
  if ("data" in src && "width" in src && "height" in src) return src as ImageData;
  const w = (src as HTMLImageElement | ImageBitmap).width;
  const h = (src as HTMLImageElement | ImageBitmap).height;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(src as CanvasImageSource, 0, 0);
  return ctx.getImageData(0, 0, w, h);
}
