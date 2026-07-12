import { StrictMode } from 'react';
import { createRoot } from "react-dom/client";
import { enableMapSet } from "immer";
import { themeCss } from "@yoltra/ds";
import { ThemeProvider } from "@yoltra/ds/client";

import "./index.css";
import AppRouter from './App';

enableMapSet();

// Inject the Yoltra design-system stylesheet once (no server-rendered <head> in
// a Vite SPA). Provides the --yl-* tokens the brand shell is styled with.
const dsStyle = document.createElement("style");
dsStyle.setAttribute("data-yoltra-ds", "");
dsStyle.textContent = themeCss();
document.head.appendChild(dsStyle);

async function enableMocking() {
  if (process.env.NODE_ENV !== 'development') {
    return
  }

  const { worker } = await import('./mocks/browser')

  // Only the mocked API endpoints are handled; let everything else (SPA
  // navigation, vite assets, the devtools websocket) pass through untouched.
  return worker.start({ onUnhandledRequest: 'bypass' })
}

enableMocking().then(() => {
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <ThemeProvider>
        <AppRouter />
      </ThemeProvider>
    </StrictMode>
  );
})

