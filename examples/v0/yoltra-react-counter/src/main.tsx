import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ThemeProvider } from "@yoltra/ds/client";

// The design system ships one stylesheet per component, so an application carries styles for
// what it imports and nothing else. `tokens` is the custom properties both themes read from,
// and `base` sets the 10px root every `--yl-*` length is expressed against.
import "@yoltra/ds/styles/tokens.css";
import "@yoltra/ds/styles/base.css";
import "@yoltra/ds/styles/button.css";
import "@yoltra/ds/styles/badge.css";
import "@yoltra/ds/styles/callout.css";
import "@yoltra/ds/styles/codeblock.css";

import "./index.css";
import App from "./App.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </StrictMode>,
);
