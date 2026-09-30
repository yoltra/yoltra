import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { themeCss } from "@yoltra/ds";
import { applyTheme } from "@yoltra/ds/client";

import App from "./App.tsx";

// `base` sets the 10px root that every `--yl-*` length is expressed against. It is not optional:
// without it `--yl-space-2` resolves to 12.8px rather than 8px, and every spacing in this
// application is out by the same factor. This demo went without it and was.
import "@yoltra/ds/styles/base.css";

// The tokens themselves, injected once. There is no server-rendered head in a Vite SPA, and this
// demo renders no design-system components, so the custom properties are the whole of what it
// needs -- `themeCss()` is that, and nothing else.
const dsStyle = document.createElement("style");
dsStyle.setAttribute("data-yoltra-ds", "");
dsStyle.textContent = themeCss();
document.head.appendChild(dsStyle);

// A dark, full-bleed canvas demo, so pin the dark theme rather than following system preference.
applyTheme("dark");

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
