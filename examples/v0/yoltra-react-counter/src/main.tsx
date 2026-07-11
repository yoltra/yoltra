import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { themeCss } from "@yoltra/ds";
import { ThemeProvider } from "@yoltra/ds/client";
import "./index.css";
import App from "./App.tsx";

// Inject the Yoltra design-system stylesheet once. In a Vite SPA there is no
// server-rendered <head>, so we add the <style> before the first paint.
const dsStyle = document.createElement("style");
dsStyle.setAttribute("data-yoltra-ds", "");
dsStyle.textContent = themeCss();
document.head.appendChild(dsStyle);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </StrictMode>,
);
