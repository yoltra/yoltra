/**
 * What a wildcard subscription costs per emit.
 *
 * @remarks
 * `LooseEventBus.emit` walks every pattern registered on the channel and tests each one, so
 * the cost is linear in the number of *patterns*, not in the number that match. Exact
 * handlers are a map lookup and are here as the baseline the pattern rows are read against.
 *
 * This is the claim behind the tracked finding about wildcard matching being unmeasured. The
 * numbers are the point; whether they justify a pattern index is a decision to take with them
 * in hand.
 */

import { bench, describe } from "vitest";

import { LooseEventBus } from "../src/eventBus/LooseEventBus";

const noop = (): void => undefined;

function withExact(count: number): LooseEventBus<string, string, unknown> {
  const bus = new LooseEventBus<string, string, unknown>();
  for (let i = 0; i < count; i++) bus.on("ui", `event.${i}`, noop);
  return bus;
}

function withPatterns(count: number): LooseEventBus<string, string, unknown> {
  const bus = new LooseEventBus<string, string, unknown>();
  for (let i = 0; i < count; i++) bus.on("ui", `section${i}.*`, noop);
  return bus;
}

/**
 * The shape the first-segment index cannot narrow: every pattern begins with `**`, so every one
 * of them is a candidate for every subject.
 *
 * @remarks
 * Here deliberately. Without it the wildcard rows above read as an unqualified win, when what
 * they actually show is the common case — distinct event families — going from a linear scan to
 * a map lookup. This row is the worst case, and what is left in it is the saving from splitting
 * each pattern once at registration rather than on every test.
 */
function withUnnarrowablePatterns(count: number): LooseEventBus<string, string, unknown> {
  const bus = new LooseEventBus<string, string, unknown>();
  for (let i = 0; i < count; i++) bus.on("ui", `**.event${i}`, noop);
  return bus;
}

for (const count of [1, 10, 100, 1000]) {
  describe(`${count} subscriptions`, () => {
    const exact = withExact(count);
    bench("exact", () => {
      exact.emit("ui", "event.0", null);
    });

    const patterns = withPatterns(count);
    bench("wildcard", () => {
      // One match. The first segment selects the bucket, so the number of patterns tested does
      // not grow with the number registered.
      patterns.emit("ui", "section0.open", null);
    });

    const unnarrowable = withUnnarrowablePatterns(count);
    bench("wildcard, leading **", () => {
      // Still linear: nothing about the subject rules any of these out.
      unnarrowable.emit("ui", "section0.event0", null);
    });
  });
}
