export function eventToSvgUserCoords(
  event: React.MouseEvent<SVGSVGElement> | React.PointerEvent<SVGSVGElement>,
  svgEl: SVGSVGElement
) {
  const matrix = svgEl.getScreenCTM();
  if (!matrix) return { x: 0, y: 0 };

  // clientX/Y → DOMPoint → inverse(screenCTM)
  const point = new DOMPoint(event.clientX, event.clientY);
  const svgPoint = point.matrixTransform(matrix.inverse());
  return { x: svgPoint.x, y: svgPoint.y };
}

export function getRandomInt(min: number, max: number): number {
  min = Math.ceil(min); // ennsure min is an integer
  max = Math.floor(max); // ennsure max is an integer

  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Generate a random point within a circular range of (cx, cy).
 * Returns[x, y] random coordinates inside the circle */
export function randomPointInCircle(
  cx: number,       // center x coordinate
  cy: number,       // center y coordinate
  radius: number,   // maximum distance from center
): [number, number] {
  const angle = Math.random() * 2 * Math.PI;
  const r = radius * Math.sqrt(Math.random()); // sqrt for uniform distribution
  const x = cx + r * Math.cos(angle);
  const y = cy + r * Math.sin(angle);
  
  return [x, y];
}

type Point = { x: number; y: number };

/**
 * Move point A one simulation step so it avoids B at radius `avoidRadius`
 * while also sliding tangentially around B (orbit behavior) */
export function stepOrbitWhileAvoiding(
  a: Point,                   // current position of A
  b: Point,                   // current position of B (the thing to avoid/orbit)
  avoidRadius: number,        // minimum distance to maintain from B (pixels)
  dt: number,                 // time step (seconds)
  options: {                  // tunable gains and speed limit
    radialGain?: number;      // how strongly we push outward if inside the radius
    tangentialSpeed?: number; // how fast we orbit around B (pixels/sec)
    maxSpeed?: number;        // absolute cap on the instantaneous speed (pixels/sec)
    clockwise?: boolean;      // choose true for clockwise orbit, false for counter-clockwise
  } = {}
): Point {
  const {
    radialGain = 32.0,        // push strength when too close
    tangentialSpeed = 32,     // orbit speed (constant magnitude)
    maxSpeed = 75,            // clamp to avoid jitter/tunneling
    clockwise = true,         // choose orbit direction
  } = options;
  
  // vector from B to A (pointing “outward” from the thing we avoid)
  let deltaX = a.x - b.x;
  let deltaY = a.y - b.y;

  // distance and unit radial vector (B -> A)
  let distance = Math.hypot(deltaX, deltaY);

  // handle the degenerate case where A and B are on top of each other.
  // we pick an arbitrary outward direction (to the right).
  if (distance < 1e-6) {
    deltaX = 1;
    deltaY = 0;
    distance = 1;
  }

  const unitRadialX = deltaX / distance;
  const unitRadialY = deltaY / distance;

  /**
   * tangent unit vector is the radial vector rotated ±90°
   * (+y, -x) gives one direction; (-y, +x) gives the opposite */
  const tangentX = clockwise ?  unitRadialY : -unitRadialY;
  const tangentY = clockwise ? -unitRadialX :  unitRadialX;

  // radial correction velocity (only if too close)
  const penetration = Math.max(0, avoidRadius - distance);

  // push outward proportional to how far we are inside (spring-like)
  const radialVelX = radialGain * penetration * unitRadialX;
  const radialVelY = radialGain * penetration * unitRadialY;

  // tangencial orbit velocity (constant magnitude around the circle)
  const tangentialVelX = tangentialSpeed * tangentX;
  const tangentialVelY = tangentialSpeed * tangentY;

  // combine velocities and clamp the result
  let velocityX = radialVelX + tangentialVelX;
  let velocityY = radialVelY + tangentialVelY;

  const speed = Math.hypot(velocityX, velocityY);
  if (speed > maxSpeed) {
    const scale = maxSpeed / speed;
    velocityX *= scale;
    velocityY *= scale;
  }

  // euler integrate position
  return {
    x: a.x + velocityX * dt,
    y: a.y + velocityY * dt,
  };
}


export function clamp(v: number, min: number, max: number): number {
  return v < min ? min : v > max ? max : v;
}

/**
 * Checks if two circles overlap or touch.
 * returns True if the circles overlap or touch, false otherwise */
export function doCirclesOverlap(
  circle1: any, // the first circle object with x, y coordinates and radius
  circle2: any  // the second circle object with x, y coordinates and radius
): boolean {
  // calculate the distance between the centers of the two circles
  const dx = circle1.x - circle2.x;
  const dy = circle1.y - circle2.y;
  const distance = Math.sqrt(dx * dx + dy * dy);

  // calculate the sum of the radii
  const sumOfRadii = circle1.r + circle2.r;

  // check if the distance is less than or equal to the sum of the radii
  return distance <= sumOfRadii;
}

// frame-rate independent exponential approach: move current toward target with a given half-life.
export function expApproach(current: number, target: number, dtSeconds: number, halfLifeSeconds: number): number {
  if (halfLifeSeconds <= 0) return target;
  // decay = 0.5^(dt/halfLife)
  const decay = Math.pow(0.5, dtSeconds / halfLifeSeconds);
  return target + (current - target) * decay;
}

export function expApproach2D(curr: {x:number;y:number}, tgt: {x:number;y:number}, dtSeconds: number, halfLifeSeconds: number) {
  return {
    x: expApproach(curr.x, tgt.x, dtSeconds, halfLifeSeconds),
    y: expApproach(curr.y, tgt.y, dtSeconds, halfLifeSeconds),
  };
}

export function nearly(a: number, b: number, eps = 0.01): boolean {
  return Math.abs(a - b) <= eps;
}

export function nearly2D(a: {x:number;y:number}, b: {x:number;y:number}, eps = 0.01): boolean {
  const dx = a.x - b.x, dy = a.y - b.y;
  
  return (dx*dx + dy*dy) <= eps*eps;
}

export function hexToRgb(hex: string): [number, number, number] {
  const h = hex.startsWith("#") ? hex.slice(1) : hex;
  const i = parseInt(h.length === 3 ? h.split("").map(c => c + c).join("") : h, 16);

  return [(i >> 16) & 255, (i >> 8) & 255, i & 255];
}
export function rgbToHex(r: number, g: number, b: number): string {
  const h = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, "0");

  return `#${h(r)}${h(g)}${h(b)}`.toUpperCase();
}
export function nearlyRgb(a: [number, number, number], b: [number, number, number], eps = 0.75): boolean {
  // euclidean residual in RGB space
  const dx = a[0] - b[0], dy = a[1] - b[1], dz = a[2] - b[2];

  return (dx * dx + dy * dy + dz * dz) <= eps * eps;
}

export function expApproachRgb(curr: [number, number, number], tgt: [number, number, number], dtSeconds: number, halfLifeSeconds: number): [number, number, number] {
  if (halfLifeSeconds <= 0) {
    return [tgt[0], tgt[1], tgt[2]]
  };

  const decay = Math.pow(0.5, dtSeconds / halfLifeSeconds);

  return [
    tgt[0] + (curr[0] - tgt[0]) * decay,
    tgt[1] + (curr[1] - tgt[1]) * decay,
    tgt[2] + (curr[2] - tgt[2]) * decay,
  ];
}


export function rgbaToHex(r: number, g: number, b: number): string {
  const h = (n: number) => n.toString(16).padStart(2, "0");
  return `#${h(r)}${h(g)}${h(b)}`.toUpperCase();
}

export type ImageSource = HTMLImageElement | ImageBitmap | ImageData;

export function toImageData(src: ImageSource): ImageData {
  if ("data" in src && "width" in src && "height" in src) return src as ImageData;

  const w = (src as any).width as number;
  const h = (src as any).height as number;
  const canvas = document.createElement("canvas");

  canvas.width = w;
  canvas.height = h;

  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(src as any, 0, 0);

  return ctx.getImageData(0, 0, w, h);
}

