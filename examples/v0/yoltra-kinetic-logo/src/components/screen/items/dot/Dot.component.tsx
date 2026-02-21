import { useAtomicProp } from "../../../../state/hooks";

interface PixelDotProps {
  id: string;
}

/**
 * A single pixel-dot rendered as an SVG `<circle>`.
 *
 * Subscribes atomically to its own path in the Yoltra store
 * (`pixel → dots → <id>`).  Only this component re-renders when its
 * dot moves — all other dot components remain untouched.
 *
 * No `memo`, no `useMemo` — Yoltra's atomic subscriptions are the
 * single source of render isolation. */
export const PixelDot = ({ id }: PixelDotProps) => {
  const dot = useAtomicProp({
    reducer: "pixel",
    property: `dots.${id}`,
  });

  // The dot is in state only after the simulation emits its first batchUpdate.
  // Returning null avoids a brief 0,0 flash on mount.
  if (!dot) return null;

  // r is controlled globally via the --dot-radius CSS variable (set by ConfigPanel).
  return <circle cx={dot.x} cy={dot.y} fill={dot.color} />;
};
