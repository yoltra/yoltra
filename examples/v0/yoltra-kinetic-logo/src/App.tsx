import { useEffect, useRef, useState } from "react";

import { BrandChip } from "./components/brand-chip/BrandChip.component";
import { ConfigPanel } from "./components/config-panel/ConfigPanel.component";
import { Screen } from "./components/screen/Screen.component";
import {
  DEFAULT_DOT_RADIUS_PX,
  DEFAULT_EXTRACTION_CONFIG,
  type ExtractionConfig,
} from "./config";
import { store } from "./state/yoltra";
import { Engine } from "./utils/engine/Engine";
import { Simulation } from "./utils/engine/Simulation";
import { extractDotSpecsFromImage } from "./utils/image/extract";
import { loadImagePixels } from "./utils/image/imagePixels";

import logoUrl from "./assets/logo.png";

// Apply the initial CSS variable so circles have the right radius on first render.
document.documentElement.style.setProperty("--dot-radius", `${DEFAULT_DOT_RADIUS_PX}px`);

// Cache the decoded pixel data so restarts don't re-fetch the network.
let cachedImageData: ImageData | null = null;

export default function App() {
  const engineRef = useRef<Engine | null>(null);
  const [extractionConfig, setExtractionConfig] = useState<ExtractionConfig>(
    DEFAULT_EXTRACTION_CONFIG,
  );

  useEffect(() => {
    // Guard against React StrictMode double-fire and rapid restarts:
    // if the async setup finishes after this effect is cleaned up, bail out.
    let mounted = true;

    const engine = new Engine({ targetFPS: 60, autoStart: false }, store);
    engineRef.current = engine;

    (async () => {
      // Load once, reuse across restarts.
      if (!cachedImageData) {
        cachedImageData = await loadImagePixels(logoUrl);
      }
      if (!mounted) return;

      const { specs, width, height } = extractDotSpecsFromImage(cachedImageData, {
        maxDots: extractionConfig.maxDots,
        stride: extractionConfig.stride,
        minAlpha: extractionConfig.minAlpha,
      });

      if (!mounted) return;

      store.emit("pixel", "size", { height, width });
      store.emit("pixel", "count", { total: specs.length });

      const sim = new Simulation(engine, { items: specs, name: "YoltraPixelLogo" });
      engine.attach(sim);
      engine.init();
      engine.start();
    })();

    return () => {
      mounted = false;
      try {
        engineRef.current?.teardown();
      } finally {
        engineRef.current = null;
      }
    };
  }, [extractionConfig]);

  // No Provider — createYoltra's hooks default to this store. The ConfigPanel's
  // restart updates extractionConfig, which re-runs the effect above.
  return (
    <>
      <BrandChip />
      <ConfigPanel onRestart={setExtractionConfig} />
      <Screen />
    </>
  );
}
