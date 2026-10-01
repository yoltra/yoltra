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
  EffectSpec,
  EventKey,
  EventMapBase,
  EventUnion,
  MiddlewareFunction,
  MiddlewareInput,
  ReducerSpec,
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
 * - `{ channelPattern: '*::plan' }` matches if event's channel matches the pattern, `*` standing
 *   for zero or more characters.
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

  // Match a channel pattern. For a channel that arrives namespaced — `alias::plan` beside a local
  // `plan` — where the exact forms cannot help because the aliases are not known in advance.
  if ("channelPattern" in when) {
    return channelPatternMatches(when.channelPattern, event.channel);
  }

  // Not reached by a registered consumer: `assertRegistrable` refuses every other shape before
  // it can be installed. Kept so a matcher that somehow slips past still matches nothing.
  return false;
}

/**
 * What kind of consumer a `when` matcher is being registered for. Reducers and effects take
 * exact matchers only; middleware also takes `channelPattern`.
 *
 * @internal
 */
export type WhenConsumer = "reducer" | "effect" | "middleware";

/** The four exact forms, as the refusals name them. */
const EXACT = "{ keys }, { channel }, { channels } or { any: true }";

/**
 * Why `when` cannot be registered for `consumer`, or `undefined` when it can.
 *
 * @remarks
 * Two failures, both of which used to register without a word and then match nothing:
 *
 * - **`channelPattern` on a reducer or an effect.** Only middleware honours it. A reducer's
 *   input set has to be closed and readable from its spec, or replaying the same log against
 *   the same code could fold a different set of events once something adds a channel; and every
 *   effect for an event runs one after another, so a pattern would quietly enlist an effect in
 *   the chain of every channel it matched. Both seams read the matcher as keyed, found no keys,
 *   and mounted on nothing: a reducer that never ran, an effect that was not even reported.
 * - **A shape that is none of the five forms**, such as `{ any: false }`, `{ keys: "a" }` or
 *   `{}`. Each of those matched nothing on every seam. The message prints the matcher rather
 *   than diagnosing each field: it is what the caller needs to find, and it costs the bundle
 *   one string instead of six.
 *
 * A matcher that matches nothing *on purpose* is still accepted: `{ keys: [] }` and
 * `{ channels: [] }` are well-formed, and a caller may build them from a list that happens to
 * be empty.
 *
 * @internal
 */
export function describeWhenProblem(
  when: unknown,
  consumer: WhenConsumer,
): string | undefined {
  if (when === undefined) return undefined;
  const w = when as Record<string, unknown> | null;
  const isObject = w !== null && typeof w === "object" && !Array.isArray(w);

  if (isObject && "channelPattern" in w && consumer !== "middleware") {
    return `channelPattern is middleware-only; a ${consumer} takes ${EXACT}. Name the channels, or move the pattern to a middleware`;
  }

  const wellFormed =
    isObject &&
    ("channelPattern" in w
      ? typeof w.channelPattern === "string"
      : "any" in w
        ? w.any === true
        : "keys" in w
          ? Array.isArray(w.keys)
          : "channel" in w
            ? typeof w.channel === "string"
            : "channels" in w && Array.isArray(w.channels));

  return wellFormed
    ? undefined
    : `when ${JSON.stringify(when)} is not ${EXACT}${consumer === "middleware" ? " or { channelPattern }" : ""}`;
}

/**
 * A function's own name, or `undefined` when it has none worth printing.
 *
 * @remarks
 * An arrow written inline as `{ effect: () => {} }` is named after the property key, so a
 * message would have called it `effect "effect"`, which reads like a name and is not one.
 *
 * @internal
 */
function ownName(fn: unknown, key: string): string | undefined {
  const name = typeof fn === "function" ? fn.name : undefined;
  return name && name !== key ? name : undefined;
}

/**
 * Checks every matcher in a registration batch before any of it is applied, and throws on the
 * first one that cannot be registered.
 *
 * @remarks
 * Up front and across the whole batch, so a refused call leaves the store exactly as it was.
 * `replace*` and `hotReplace` unmount before they mount; a check that fired from inside the
 * mount loop would have left a store with half of the old set removed and none of the new one
 * installed.
 *
 * @internal
 */
export function assertRegistrable(batch: {
  readonly reducers?: Readonly<Record<string, ReducerSpec<any, any>>>;
  readonly effects?: ReadonlyArray<EffectSpec<any, any>>;
  readonly middleware?: ReadonlyArray<MiddlewareInput<any, any>>;
}): void {
  const check = (when: unknown, consumer: WhenConsumer, name: string | undefined): void => {
    const problem = describeWhenProblem(when, consumer);
    if (problem !== undefined) {
      throw new Error(
        `[yoltra] ${name ? `${consumer} "${name}"` : `an anonymous ${consumer}`}: ${problem}`,
      );
    }
  };
  for (const [name, spec] of Object.entries(batch.reducers ?? {})) {
    check(spec?.when, "reducer", name);
  }
  for (const spec of batch.effects ?? []) {
    check(spec?.when, "effect", spec?.meta?.name ?? ownName(spec?.effect, "effect"));
  }
  for (const input of batch.middleware ?? []) {
    if (typeof input !== "function") {
      check(input?.when, "middleware", input?.meta?.name ?? ownName(input?.middleware, "middleware"));
    }
  }
}

/** Compiled patterns, because a matcher runs once per middleware per event. */
const patternCache = new Map<string, RegExp>();

/**
 * Whether `channel` matches `pattern`, where `*` stands for zero or more characters.
 *
 * @remarks
 * `*` is deliberately the only metacharacter and stands for **zero or more** characters; everything
 * else is escaped, so a pattern cannot become an expression that backtracks.
 *
 * Zero rather than one, so that one rule can cover a channel and its namespaced forms together:
 * `"*plan"` matches `plan` and `bb::plan`, which is the case this form exists for. The cost of
 * that choice is the usual glob one — it also matches `replan` — so a store with both wants
 * `"*::plan"` and a separate rule for the local channel.
 *
 * @internal
 */
export function channelPatternMatches(pattern: string, channel: string): boolean {
  let re = patternCache.get(pattern);
  if (re === undefined) {
    const source = pattern
      .split("*")
      .map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
      .join(".*");
    re = new RegExp(`^${source}$`);
    patternCache.set(pattern, re);
  }
  return re.test(channel);
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
