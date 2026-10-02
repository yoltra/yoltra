/**
 * @module @yoltra/core
 */

import type { Clock, Scheduler } from "../types";

/**
 * The system clock, read at each call.
 *
 * @remarks
 * `Date.now` is looked up when `now()` runs, not captured here, so a fake clock installed after a
 * store was created still applies.
 *
 * @internal
 */
export const systemClock: Clock = { now: () => Date.now() };

/**
 * The global timers, looked up each time a timer is armed or cleared.
 *
 * @remarks
 * Not captured at import, for the reason {@link systemClock} is not: fake timers installed after a
 * store was created must still drive it.
 *
 * @internal
 */
export const globalScheduler: Scheduler = {
  setTimeout: (callback, delayMs) => setTimeout(callback, delayMs),
  clearTimeout: (handle) => clearTimeout(handle as ReturnType<typeof setTimeout>),
};
