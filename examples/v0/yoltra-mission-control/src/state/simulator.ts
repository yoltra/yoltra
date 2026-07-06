import { useEffect } from "react";

import { store } from "./store";

/**
 * Self-driving telemetry. Every ~900 ms the mission clock ticks and a random
 * satellite reports telemetry — this keeps the DevTools timeline alive and
 * slowly drains batteries, so `boost` eventually trips the safety middleware.
 */
export function useMissionSimulator(): void {
  useEffect(() => {
    const timer = setInterval(() => {
      void store.emit("system", "tick", null);

      const sats = store.getState().fleet.satellites;
      const sat = sats[Math.floor(Math.random() * sats.length)];
      if (!sat) return;

      void store.emit("telemetry", "drain", { id: sat.id, amount: 1 + Math.floor(Math.random() * 3) });
      if (Math.random() < 0.5) {
        void store.emit("telemetry", "signalShift", { id: sat.id, value: 40 + Math.floor(Math.random() * 60) });
      }
      if (Math.random() < 0.35) {
        void store.emit("telemetry", "collect", { id: sat.id, mb: 5 + Math.floor(Math.random() * 25) });
      }
    }, 900);

    return () => clearInterval(timer);
  }, []);
}
