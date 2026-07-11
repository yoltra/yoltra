import "./BrandChip.style.css";

/**
 * Minimal Yoltra brand mark, pinned to the top-left over the dot canvas. Keeps
 * the demo identifiable in screenshots without covering the animation.
 */
export function BrandChip() {
  return (
    <a className="brand-chip" href="https://yoltra.dev" title="Yoltra">
      <img src="/logo.svg" width={26} height={26} alt="Yoltra" />
      <span>Yoltra</span>
    </a>
  );
}
