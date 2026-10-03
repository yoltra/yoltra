/**
 * Development warnings for payloads and slices that have grown too large.
 *
 * @remarks
 * Outside `createStore`, so an application that does not import it ships none of it. A large
 * value is not an error, so nothing in the store refuses one; but every event is copied to
 * devtools and may be fingerprinted for deduplication, and every slice is diffed, frozen in
 * development and persisted. A value that grew past what anyone intended is cheaper to find here
 * than in a profile.
 *
 * @module @yoltra/core
 */

import type { InstrumentationObserver, InstrumentOptions, Unsubscribe } from "../types";

/** The store surface the helper needs. @public */
export interface SizeWatchedStore {
  readonly name?: string;
  getState(): unknown;
  instrument(observer: InstrumentationObserver<any>, options?: InstrumentOptions): Unsubscribe;
}

/**
 * Limits for {@link warnOnLargeValues}. A value warns when it exceeds either of its limits.
 *
 * @remarks
 * Values are counted the way the codec counts them: every object, array, map or set entry and
 * every leaf is one. Bytes are an estimate of the serialized size: a string by its length, a
 * number as 8, a typed array or `ArrayBuffer` by its `byteLength`, plus object keys.
 *
 * @public
 */
export interface LargeValueLimits {
  /** @defaultValue 5 000 */
  readonly maxPayloadNodes?: number;
  /** @defaultValue 262 144 (256 KB) */
  readonly maxPayloadBytes?: number;
  /**
   * @defaultValue 50 000, half of the persistence budget, so a slice warns well before `persist`
   * would refuse to write it.
   */
  readonly maxSliceNodes?: number;
  /** @defaultValue 4 194 304 (4 MB) */
  readonly maxSliceBytes?: number;
  /** Receives each warning. Defaults to `console.warn`. */
  readonly warn?: (message: string, detail: Readonly<Record<string, unknown>>) => void;
}

/** What one bounded walk found. @internal */
interface Measure {
  nodes: number;
  bytes: number;
}

/**
 * Counts a value's nodes and estimated bytes, stopping as soon as either passes its limit.
 *
 * @remarks
 * Bounded so a measurement never costs more than the limit it checks: an enormous slice is
 * walked only as far as needed to know it is too large. Iterative, so depth cannot overflow the
 * stack, and cycle-safe.
 *
 * @internal
 */
export function measureValue(value: unknown, maxNodes: number, maxBytes: number): Measure {
  const m: Measure = { nodes: 0, bytes: 0 };
  const seen = new Set<object>();
  const stack: unknown[] = [value];
  while (stack.length > 0 && m.nodes <= maxNodes && m.bytes <= maxBytes) {
    const v = stack.pop();
    m.nodes += 1;
    if (typeof v === "string") m.bytes += v.length;
    else if (typeof v === "number" || typeof v === "bigint") m.bytes += 8;
    else if (v === null || typeof v !== "object") m.bytes += 4;
    else if (ArrayBuffer.isView(v) || v instanceof ArrayBuffer) m.bytes += v.byteLength;
    else if (!seen.has(v)) {
      seen.add(v);
      if (v instanceof Map) {
        for (const [k, item] of v) stack.push(k, item);
      } else if (v instanceof Set) {
        for (const item of v) stack.push(item);
      } else if (Array.isArray(v)) {
        for (const item of v) stack.push(item);
      } else {
        for (const key of Object.keys(v)) {
          m.bytes += key.length;
          stack.push((v as Record<string, unknown>)[key]);
        }
      }
    }
  }
  return m;
}

/**
 * Warns, in development, when an event payload or a slice grows past a limit.
 *
 * @returns A function that stops watching. In production it watches nothing and returns a no-op.
 *
 * @remarks
 * Checks each committed event's payload, and each slice the event changed. Warns once per event
 * key and once per slice, naming the store, the value and the limit it passed. Registered with
 * `{ ephemeral: true }`, so traffic on an ephemeral channel is checked too.
 *
 * @example
 * ```ts
 * if (import.meta.env.DEV) warnOnLargeValues(store, { maxSliceNodes: 20_000 });
 * ```
 *
 * @public
 */
export function warnOnLargeValues(store: SizeWatchedStore, limits: LargeValueLimits = {}): Unsubscribe {
  if (process.env.NODE_ENV === "production") return () => undefined;

  const payloadNodes = limits.maxPayloadNodes ?? 5_000;
  const payloadBytes = limits.maxPayloadBytes ?? 262_144;
  const sliceNodes = limits.maxSliceNodes ?? 50_000;
  const sliceBytes = limits.maxSliceBytes ?? 4_194_304;
  const warn = limits.warn ?? ((message: string) => console.warn(message));
  const warned = new Set<string>();
  const who = `Store "${store.name ?? "?"}"`;

  const check = (
    id: string,
    what: string,
    value: unknown,
    maxNodes: number,
    maxBytes: number,
    advice: string,
  ): void => {
    if (warned.has(id)) return;
    const m = measureValue(value, maxNodes, maxBytes);
    const limit =
      m.nodes > maxNodes
        ? `more than ${maxNodes} values`
        : m.bytes > maxBytes
          ? `more than about ${maxBytes} bytes`
          : undefined;
    if (limit === undefined) return;
    warned.add(id);
    warn(`[yoltra] ${who}: ${what} holds ${limit}. ${advice}`, { what, nodes: m.nodes, bytes: m.bytes });
  };

  return store.instrument(
    (info) => {
      if (!info.committed) return;
      const { channel, type, payload } = info.event;
      check(
        `event:${channel}::${type}`,
        `the payload of "${channel}/${type}"`,
        payload,
        payloadNodes,
        payloadBytes,
        "Every event is copied to devtools and may be fingerprinted for deduplication; send a " +
          "reference or an id, and keep the bulk data where it already lives.",
      );
      const state = store.getState() as Record<string, unknown>;
      for (const slice of new Set(info.changedPaths.map((path) => path.split(".")[0]!))) {
        check(
          `slice:${slice}`,
          `slice "${slice}"`,
          state[slice],
          sliceNodes,
          sliceBytes,
          "Every change is diffed and every slice may be persisted; normalise it, or keep bulk " +
            "data outside the store and hold only what the UI reads.",
        );
      }
    },
    { ephemeral: true },
  );
}
