import { StrictMode } from 'react';
import { createRoot } from "react-dom/client";
import { enableMapSet } from "immer";

import "./index.css";
import AppRouter from './App';

enableMapSet();

async function enableMocking() {
  if (process.env.NODE_ENV !== 'development') {
    return
  }

  const { worker } = await import('./mocks/browser')

  return worker.start()
}

enableMocking().then(() => {
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
        <AppRouter />
    </StrictMode>
  );
})

