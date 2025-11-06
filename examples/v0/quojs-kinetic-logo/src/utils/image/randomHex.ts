type RandomHexOptions = {
  /**
   * per-channel lower bound [0..255] */
  min?: number;
  /**
   * per-channel upper bound [0..255] */
  max?: number;
  /**
   * custom RNG returning [0,1). Useful for tests/seeding. */
  rng?: () => number;
  /**
   * uppercase output (#A1B2C3) instead of lowercase. */
  uppercase?: boolean;
};

export function randomHexColor(opts: RandomHexOptions = {}): string {
  const rng = opts.rng ?? Math.random;
  const min = clamp(Math.floor(opts.min ?? 0), 0, 255);
  const max = clamp(Math.floor(opts.max ?? 255), 0, 255);
  if (min > max) throw new Error(`min (${min}) must be <= max (${max})`);

  const comp = () => Math.floor(rng() * (max - min + 1)) + min;
  const hex = (v: number) => v.toString(16).padStart(2, "0");

  const r = comp(), g = comp(), b = comp();
  const out = `#${hex(r)}${hex(g)}${hex(b)}`;
  
  return opts.uppercase ? out.toUpperCase() : out;
}

function clamp(v: number, lo: number, hi: number) {
  return v < lo ? lo : v > hi ? hi : v;
}
