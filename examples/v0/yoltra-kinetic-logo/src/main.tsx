import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { themeCss } from "@yoltra/ds";

import App from "./App.tsx";

// Inject the Yoltra design-system tokens/styles once. This is a dark, full-bleed
// canvas demo, so we pin the dark theme rather than following system preference.
const dsStyle = document.createElement("style");
dsStyle.setAttribute("data-yoltra-ds", "");
dsStyle.textContent = themeCss();
document.head.appendChild(dsStyle);
document.documentElement.setAttribute("data-theme", "dark");

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
