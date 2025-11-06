import { useEffect, useRef } from "react";

import { Simulation } from "./utils/engine/Simulation";
import { loadImagePixels } from "./utils/image/imagePixels";
import { extractCircleSpecsFromImage } from "./utils/image/extract";

import { store } from "./state/store";
import { Engine } from "./utils/engine/Engine";

import { AppStoreContext } from "./context/Store.context";
import { Screen } from "./components/screen/Screen.component";

import quoLogo from "./assets/logo.png";

export default function App() {
  const engineRef = useRef<Engine | null>(null);

  useEffect(() => {
    const engine = new Engine({ targetFPS: 60, autoStart: false }, store);
    engineRef.current = engine;

    const setup = async () => {
      const maxCircles = 1500;

      const image = await loadImagePixels(quoLogo);

      const { specs, width, height, groupCounts } = extractCircleSpecsFromImage(
        image,
        { spacing: 3, initialR: 0.5, maxCircles }
      );

      store.dispatch("logo", "size", { height, width });
      store.dispatch("logo", "count", groupCounts);

      const sim = new Simulation(engine, {
        items: specs,
        name: "Quo Packing",
      });

      engine.attach(sim);
      engine.init();
      engine.start();
    };

      setup();
    return () => {
      try {
        engineRef.current?.teardown();
      } finally {
        engineRef.current = null;
      }
    };
  }, []);

  return (
    <AppStoreContext value={store}>
    <Screen />
  </AppStoreContext>
  );
}