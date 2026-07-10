import { createRoot } from "react-dom/client";

import App from "./App";
import "./styles.css";

// No StrictMode here on purpose: the per-card render counters are part of the
// demo, and StrictMode's intentional double-render would double every count.
const root = document.getElementById("root");
if (root) createRoot(root).render(<App />);
