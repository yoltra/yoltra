import { createRoot } from "react-dom/client";
import { themeCss } from "@yoltra/ds";

import App from "./App";
import "./styles.css";

// Add the Yoltra design-system tokens/components (Badge, Callout). This is a
// dark mission-control UI, so pin the DS dark tokens; the app keeps its own
// bespoke telemetry theme in styles.css — DS only layers brand accents on top.
const dsStyle = document.createElement("style");
dsStyle.setAttribute("data-yoltra-ds", "");
dsStyle.textContent = themeCss();
document.head.appendChild(dsStyle);
document.documentElement.setAttribute("data-theme", "dark");

// No StrictMode here on purpose: the per-card render counters are part of the
// demo, and StrictMode's intentional double-render would double every count.
const root = document.getElementById("root");
if (root) createRoot(root).render(<App />);
