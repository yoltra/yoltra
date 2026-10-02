/**
 * The `"channel::type"` key, and the collision it can hide.
 *
 * @remarks
 * The store joins a channel and a type into one string key and uses it in six places: the
 * event-subscriber map, the effects map, the keyed-effect registry, two dedup fingerprints, and the
 * introspection paths that split it back apart. Nothing ever checked that the join is
 * unambiguous, and two different pairs can produce the same key:
 *
 * ```
 * ("a::b", "c")   ->  "a::b::c"
 * ("a",    "b::c") ->  "a::b::c"
 * ```
 *
 * Which means, demonstrably: a subscriber or effect registered for one is invoked for the other,
 * and with a dedup window one silently deduplicates the other.
 *
 * **Why this warns on the collision rather than on `::` itself.** A consuming runtime asserted that
 * the store "structurally forbids `::` in a local channel name". It does not, and it must not:
 * `::` is the established way a peer's channel is namespaced, `alias::channel`, so a
 * store bridging peers is full of legitimate `::` and a warning on the separator would fire
 * constantly for correct code. A warning nobody can act on is a warning everybody mutes.
 *
 * So the rule is the precise one. A `::` in a channel is fine on its own; what is not fine is two
 * pairs that collapse together, and that is what is reported — naming both pairs, because either
 * one alone looks blameless.
 */

/** The separator the store joins channel and type with. */
export const RESERVED_SEPARATOR = "::";

/**
 * Warns when two different `(channel, type)` pairs join to one key, once per colliding key.
 *
 * @remarks
 * Called with the pair being emitted. Development only: it returns at once in production.
 *
 * @internal
 */
export type KeyCollisionCheck = (channel: string, type: string) => void;

/**
 * Creates the collision check for one store.
 *
 * @param storeName - Named in the warning, because a process with several stores otherwise
 *   leaves the reader to guess which one.
 * @param warn - Receives the warning and the pairs involved. Defaults to `console.warn`.
 *
 * @remarks
 * **Per store, not per process.** The keys only collide inside one store's maps, so what was seen
 * has to be remembered per store too. A process-wide record got both directions wrong: once one
 * store had reported a key, a second store with the same collision stayed silent, and two stores
 * that each used *one* of the pairs, which can never interfere, were reported as colliding.
 *
 * The record is development only and unbounded by design: one entry per distinct `(channel, type)`
 * a store emits whose channel or type contains the separator, which is application surface rather
 * than traffic. It lives as long as the store does.
 *
 * @internal
 */
export function createKeyCollisionCheck(
  storeName: string,
  warn: (message: string, detail: Readonly<Record<string, unknown>>) => void = (message) =>
    console.warn(message),
): KeyCollisionCheck {
  /** First pair seen for each joined key, so a second one that collides can be named against it. */
  const firstSeen = new Map<string, readonly [channel: string, type: string]>();
  /** Keys already reported, so alternating emits of the two colliding pairs warn once. */
  const reported = new Set<string>();

  return (channel, type) => {
    if (process.env.NODE_ENV === "production") return;
    // A pair can only collide when a separator falls somewhere it could be read either way, which
    // requires one to appear in the channel or the type. Cheap guard before touching the map.
    if (!channel.includes(RESERVED_SEPARATOR) && !type.includes(RESERVED_SEPARATOR)) return;

    const key = `${channel}${RESERVED_SEPARATOR}${type}`;
    if (reported.has(key)) return;
    const prior = firstSeen.get(key);
    if (prior === undefined) {
      firstSeen.set(key, [channel, type]);
      return;
    }
    if (prior[0] === channel && prior[1] === type) return;

    // The first pair stays recorded and the key is marked reported, so the two pairs alternating
    // warn once between them rather than on every emit.
    reported.add(key);
    warn(
      `[yoltra] Store "${storeName}": two different events share one internal key. ` +
        `("${prior[0]}", "${prior[1]}") and ("${channel}", "${type}") both join to "${key}", ` +
        `because the store keys dispatch and deduplication on "channel${RESERVED_SEPARATOR}type". ` +
        `A subscriber or effect registered for one will be invoked for the other, and a dedup ` +
        `window will let one drop the other. Rename one of them.`,
      { key, first: prior, second: [channel, type] },
    );
  };
}
