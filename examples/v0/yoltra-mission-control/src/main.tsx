import { createRoot } from "react-dom/client";

// The design system ships one stylesheet per component, so this list is exactly what the
// application renders. `tokens` holds the custom properties both themes read; `base` sets the
// 10px root every `--yl-*` length is expressed against.
import "@yoltra/ds/styles/tokens.css";
import "@yoltra/ds/styles/base.css";
import "@yoltra/ds/styles/layout.css";
import "@yoltra/ds/styles/typography.css";
import "@yoltra/ds/styles/button.css";
import "@yoltra/ds/styles/badge.css";
import "@yoltra/ds/styles/callout.css";
import "@yoltra/ds/styles/card.css";
import "@yoltra/ds/styles/feedback.css";
import "@yoltra/ds/styles/form.css";

import App from "./App";
import "./styles.css";

// A dark mission-control UI, so pin the DS dark tokens. The bespoke telemetry visuals — the
// gauges, the status colours — stay in styles.css and are built from the same tokens.
document.documentElement.setAttribute("data-theme", "dark");

// No StrictMode here on purpose: the per-card render counters are part of the
// demo, and StrictMode's intentional double-render would double every count.
const root = document.getElementById("root");
if (root) {
  // No provider anywhere in this app: `createYoltra` builds its own context and returns every
  // hook already bound to it — the Suspense pair in `OrbitalForecast` included. Import them
  // from `./state/store`, not from the `@yoltra/react` barrel, whose copies read a different
  // context that nothing here fills.
  createRoot(root).render(<App />);
}
