/**
 * Event targeting: deciding whether an event matches a `When` matcher, and reading the parts of
 * a middleware declaration.
 *
 * @remarks
 * Moved out of `Store.ts` unchanged. These four functions never touched an instance field, so
 * they were already free functions wearing method clothing, and the class kept them only because
 * that is where they were written.
 *
 * @module
 */

import type {
  EventKey,
  EventMapBase,
  EventUnion,
  MiddlewareFunction,
  MiddlewareInput,
  When,
} from "../types";

/**
 * Checks if an event matches a `When` matcher.
 *
 * @param when - The When matcher (or undefined for "all events").
 * @param event - The event to check.
 * @returns `true` if the event matches, `false` otherwise.
 *
 * @remarks
 * - `undefined` or missing `when` matches ALL events.
 * - `{ any: true }` matches ALL events.
 * - `{ keys: [...] }` matches if event's `[channel, type]` is in the array.
 * - `{ channel: 'x' }` matches if event's channel equals 'x'.
 * - `{ channels: ['x', 'y'] }` matches if event's channel is in the array.
 *
 * @internal
 */
export function matchesWhen<EM extends EventMapBase>(
  when: When<EM> | undefined,
  event: EventUnion<EM>,
): boolean {
  // No targeting = match all events
  if (!when) return true;

  // Match all events
  if ("any" in when && when.any === true) {
    return true;
  }

  // Match specific event keys
  if ("keys" in when) {
    return when.keys.some(
      ([channel, type]) => event.channel === channel && event.type === type,
    );
  }

  // Match single channel (all types within that channel)
  if ("channel" in when) {
    return event.channel === when.channel;
  }

  // Match multiple channels
  if ("channels" in when) {
    return when.channels.includes(event.channel as keyof EM & string);
  }

  return false;
}

/**
 * Extracts the middleware function from a MiddlewareInput.
 * Handles both raw functions (legacy) and MiddlewareSpec objects.
 *
 * @param input - MiddlewareInput (function or spec).
 * @returns The middleware function.
 *
 * @internal
 */
export function getMiddlewareFunction<St, EM extends EventMapBase>(
  input: MiddlewareInput<St, EM>,
): MiddlewareFunction<St, EM> {
  if (typeof input === "function") {
    return input;
  }
  return input.middleware;
}

/**
 * Gets the `when` matcher from a MiddlewareInput.
 *
 * @param input - MiddlewareInput (function or spec).
 * @returns The `when` matcher, or `undefined` for raw functions (match all).
 *
 * @internal
 */
export function getMiddlewareWhen<St, EM extends EventMapBase>(
  input: MiddlewareInput<St, EM>,
): When<EM> | undefined {
  if (typeof input === "function") {
    // Raw functions match all events
    return undefined;
  }
  return input.when;
}

/**
 * Normalizes event targeting from `when` to an array of EventKeys.
 *
 * @param spec - Object with an optional `when` matcher.
 * @returns Array of `[channel, type]` pairs.
 *
 * @internal
 */
export function normalizeEventKeys<EM extends EventMapBase>(spec: {
  when?: When<EM>;
  events?: ReadonlyArray<EventKey<EM>>;
}): ReadonlyArray<EventKey<EM>> {

  if (spec.when) {
    const when = spec.when;

    // Only `keys` can reach this point: both callers intercept pattern-based matchers
    // (`any`, `channel`, `channels`) before normalizing, because those register against the
    // emit loop rather than against per-key handler maps.
    if ("keys" in when) {
      return when.keys;
    }
  }

  // No targeting specified
  return [];
}
