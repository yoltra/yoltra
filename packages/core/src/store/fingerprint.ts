/**
 * Content fingerprints for event deduplication.
 *
 * @remarks
 * Extracted from `Store.ts` following the `matching.ts` / `paths.ts` precedent: nothing here
 * touches an instance field.
 *
 * The old fingerprint was `channel::type::JSON.stringify(payload)`, which produced two
 * inconsistent failures on the one path whose entire job is deciding whether two payloads are
 * the same. A `Map`, `Set` or typed array stringifies to `{}`, so **distinct payloads
 * collided and the second event was silently swallowed** - precisely the behaviour the README
 * says Yoltra refuses to do by default. A `BigInt` or a cycle threw, hit a timestamp fallback,
 * and was never deduped at all.
 *
 * `encodeState` already produces a faithful, JSON-stringifiable representation of all of
 * those, so fingerprinting through it makes content dedup mean what it says.
 *
 * @module
 */

import { encodeState } from "../serialize/codec";

/**
 * The node budget for a fingerprint walk.
 *
 * @remarks
 * Deliberately far below the codec's 100 000 default. A fingerprint is a dedup optimisation,
 * not a snapshot, and walking an enormous payload to decide whether to skip it defeats the
 * purpose.
 *
 * @internal
 */
const FINGERPRINT_MAX_NODES = 10_000;

/**
 * JSON with plain-object keys sorted, for a stable content fingerprint.
 *
 * @remarks
 * Insertion order is not content: `{a:1,b:2}` and `{b:2,a:1}` are the same payload and must
 * fingerprint alike, which `JSON.stringify` alone does not deliver.
 *
 * **Arrays and `Map` entries are never sorted.** Their order is semantic - `[1,2]` is not
 * `[2,1]`, and a `Map` preserves insertion order by specification. Sorting them would make
 * genuinely different payloads share a fingerprint, which is worse than the bug this module
 * exists to fix: it would silently drop real events rather than merely failing to dedup.
 *
 * Runs over the **already-encoded** value, so `Map`, `Set`, `Date` and binary have already
 * become plain JSON shapes and there is nothing exotic left to handle.
 *
 * `JSON.stringify(v, keyArray)` cannot do this: the replacer-array form applies one global
 * key list at every depth.
 *
 * @internal
 */
export function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value) ?? "null";

  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(",")}]`;
  }

  const entries = Object.entries(value as Record<string, unknown>).sort(([a], [b]) =>
    a < b ? -1 : a > b ? 1 : 0,
  );
  return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${stableStringify(v)}`).join(",")}}`;
}

/**
 * A content fingerprint for one event.
 *
 * @param channel - Event channel.
 * @param type - Event type.
 * @param payload - Event payload.
 * @returns A string that is equal for two events with equal content, or `null` when the payload
 *   could not be read in full, meaning "never deduplicate this event".
 *
 * @remarks
 * Primitives keep a fast path, but a typed one: `String(payload)` alone made the number `1`
 * and the string `"1"` the same event, as it did `true` and `"true"`. `null` and `undefined`
 * are likewise distinguished, having previously shared `::null`.
 *
 * When the payload exceeds the node budget the fingerprint degrades to **never dedupe**
 * (`null`) rather than maybe-wrongly-dedupe. Two large payloads differing only past the cutoff would
 * otherwise collide and the second would be dropped; refusing to dedup merely costs a
 * duplicate, which is the safe direction and matches what already happened to payloads the
 * old implementation could not serialize.
 *
 * @internal
 */
export function fingerprint(channel: string, type: string, payload: unknown): string | null {
  const base = `${channel}::${type}`;

  if (payload === null) return `${base}::null`;
  if (payload === undefined) return `${base}::undefined`;
  if (typeof payload !== "object") return `${base}::${typeof payload}:${String(payload)}`;

  try {
    const { value, report } = encodeState(payload, { maxNodes: FINGERPRINT_MAX_NODES });
    if (report.truncated) return null;
    return `${base}::${stableStringify(value)}`;
  } catch {
    // The codec is total over the values it knows, so reaching here means something threw
    // from a getter or a `sanitize` hook. Unique fingerprint: do not dedup what we could not
    // read. It used to be a unique timestamp-and-random string, which kept the promise but also
    // filled the dedup cache with entries nothing could ever match.
    return null;
  }
}
