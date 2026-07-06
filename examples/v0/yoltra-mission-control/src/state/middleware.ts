import type { DeepReadonly, MiddlewareFunction } from "@yoltra/core";

import type { AppEM, AppState } from "./types";

/**
 * Synchronous safety gate. Middleware runs BEFORE the reducer and can veto an
 * event by returning `false`. Here it refuses a `boost` when the target
 * satellite is below 20% battery — the vetoed event shows up in the DevTools
 * timeline as *uncommitted*, and this raises an alert.
 *
 * Async work never belongs here (it lives in effects); middleware is the
 * synchronous commit gate.
 */
export const boostGuard: MiddlewareFunction<DeepReadonly<AppState>, AppEM> = (
  state,
  event,
  emit,
) => {
  if (event.channel === "command" && event.type === "boost") {
    const { id } = event.payload as { id: string };
    const sat = state.fleet.satellites.find((s) => s.id === id);
    if (sat && sat.battery < 20) {
      emit("system", "alert", { message: `Boost aborted — LOW BATTERY on ${sat.name}` });
      return false; // veto: the reducer never runs for this event
    }
  }
  return true;
};
