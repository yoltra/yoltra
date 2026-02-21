import { useRef } from "react";

import { useEmit, useAtomicProp } from "../../state/hooks";
import { eventToSvgUserCoords } from "../../utils";
import { PixelDot } from "./items/dot/Dot.component";

import "./Screen.style.css";

/**
 * SVG canvas that hosts all pixel-dot components.
 *
 * Subscribes atomically to three independent paths in the store:
 *  - `pixel.size`    — viewport dimensions (set once after image extraction)
 *  - `pixel.enabled` — whether the animation is running
 *  - `pixel.count`   — total number of dots (set once after extraction)
 *
 * Each `<PixelDot>` child subscribes to its own `pixel.dots.<id>` path.
 * When the engine emits a `batchUpdate`, only the dot components whose
 * position changed will re-render.  This component itself re-renders only
 * when one of the three paths above changes. */
export const Screen = () => {
  const svgRef = useRef<SVGSVGElement>(null);
  const emit = useEmit();

  const { height, width } = useAtomicProp({ reducer: "pixel", property: "size" });
  const isEnabled = useAtomicProp({ reducer: "pixel", property: "enabled" });
  const count = useAtomicProp({ reducer: "pixel", property: "count" });

  const handlePointer = (event: React.PointerEvent<SVGSVGElement>) => {
    if (!isEnabled || !svgRef.current) return;
    emit("on", "mousemove", eventToSvgUserCoords(event, svgRef.current));
  };

  return (
    <svg
      ref={svgRef}
      xmlns="http://www.w3.org/2000/svg"
      className="screen"
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="xMidYMid meet"
      onPointerMove={handlePointer}
    >
      {Array.from({ length: count }, (_, i) => (
        <PixelDot key={`dot_${i}`} id={`dot_${i}`} />
      ))}
    </svg>
  );
};
