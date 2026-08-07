/**
 * Lossless encoding of store state for the wire.
 *
 * @remarks
 * The wire is JSON, and `JSON.stringify` is not a safe way to put arbitrary state on it. It does
 * not fail on the values it cannot represent — it quietly destroys them. A `Map` becomes `{}`, a
 * `Set` becomes `{}`, a `Date` becomes a string, `undefined` disappears from objects entirely,
 * and a `BigInt` or a cycle throws from inside a handler nobody awaits.
 *
 * Silent destruction is the dangerous half. The panel showed `{}` where a `Map` lived, which is
 * merely wrong; but time-travel then sent that `{}` back and applied it to the running store,
 * replacing a live `Map` with an empty object in the user's own application. A debugging tool
 * corrupting the program it is inspecting is the worst failure available to it.
 *
 * Values are therefore tagged rather than coerced. Anything JSON can carry travels unchanged;
 * anything it cannot is wrapped in a marker object that {@link decodeState} reverses exactly.
 *
 * @module
 */

/** Marker key identifying an encoded value. Chosen to be improbable in application state. */
const TAG = "$yoltra" as const;

/** What an encoded non-JSON value looks like on the wire. */
type Tagged =
  | { readonly [TAG]: "map"; readonly entries: Array<[unknown, unknown]> }
  | { readonly [TAG]: "set"; readonly values: unknown[] }
  | { readonly [TAG]: "date"; readonly iso: string }
  | { readonly [TAG]: "bigint"; readonly value: string }
  | { readonly [TAG]: "undefined" }
  | { readonly [TAG]: "nan" }
  | { readonly [TAG]: "infinity"; readonly sign: 1 | -1 }
  | { readonly [TAG]: "regexp"; readonly source: string; readonly flags: string }
  | { readonly [TAG]: "error"; readonly name: string; readonly message: string }
  | { readonly [TAG]: "ref"; readonly path: string }
  | { readonly [TAG]: "unsupported"; readonly kind: string }
  | { readonly [TAG]: "escaped"; readonly value: Record<string, unknown> };

/** Options for {@link encodeState}. */
export interface EncodeOptions {
  /**
   * Redacts a value before it leaves the process.
   *
   * @remarks
   * State frequently holds tokens, session material and personal data, and devtools traffic
   * crosses a socket to another process. Return the replacement value, or the value itself to
   * keep it. Applied before encoding, so a redacted value is encoded like any other.
   */
  readonly sanitize?: (path: string, value: unknown) => unknown;
  /**
   * Maximum number of nodes to encode. Beyond it, subtrees are replaced by a truncation marker.
   *
   * @remarks
   * A snapshot larger than the hub's frame cap is rejected outright, which reads to the user as
   * a panel that hangs. Truncating visibly is a better failure: the panel renders, and says
   * where it stopped. Defaults to 100000.
   */
  readonly maxNodes?: number;
}

/** Reports what an encode had to compromise. Empty when nothing was lost. */
export interface EncodeReport {
  /** Node budget was exhausted and some subtrees were replaced by markers. */
  readonly truncated: boolean;
  /** Values no JSON representation exists for, by path — functions, symbols, DOM nodes. */
  readonly unsupported: readonly string[];
}

/** Result of {@link encodeState}. */
export interface EncodeResult {
  readonly value: unknown;
  readonly report: EncodeReport;
}

/**
 * Encodes a value into something `JSON.stringify` can carry losslessly.
 *
 * @param input - Any value, including one holding `Map`, `Set`, `Date`, `BigInt` or cycles.
 * @param options - Redaction and size limits.
 * @returns The encoded value plus a report of anything that could not be represented.
 *
 * @example
 * ```ts
 * const { value } = encodeState({ index: new Map([['a', 1]]) });
 * JSON.stringify(value); // safe, and decodeState restores the Map
 * ```
 *
 * @public
 */
export function encodeState(input: unknown, options: EncodeOptions = {}): EncodeResult {
  const maxNodes = options.maxNodes ?? 100_000;
  const sanitize = options.sanitize;
  const unsupported: string[] = [];

  // Identity → JSON Pointer of the first place it was seen. A cycle then encodes as a reference
  // to that path rather than recursing forever, and repeated references stay repeated rather
  // than being silently expanded into copies.
  const seen = new Map<object, string>();
  let nodes = 0;
  let truncated = false;

  function walk(value: unknown, path: string): unknown {
    if (sanitize !== undefined) value = sanitize(path, value);

    nodes += 1;
    if (nodes > maxNodes) {
      truncated = true;
      return { [TAG]: "unsupported", kind: "truncated" } satisfies Tagged;
    }

    switch (typeof value) {
      case "undefined":
        return { [TAG]: "undefined" } satisfies Tagged;
      case "bigint":
        return { [TAG]: "bigint", value: value.toString() } satisfies Tagged;
      case "number":
        if (Number.isNaN(value)) return { [TAG]: "nan" } satisfies Tagged;
        if (value === Infinity) return { [TAG]: "infinity", sign: 1 } satisfies Tagged;
        if (value === -Infinity) return { [TAG]: "infinity", sign: -1 } satisfies Tagged;
        return value;
      case "function":
      case "symbol":
        unsupported.push(path);
        return { [TAG]: "unsupported", kind: typeof value } satisfies Tagged;
      case "string":
      case "boolean":
        return value;
      default:
        break;
    }

    if (value === null) return null;

    const asObject = value as object;
    const previous = seen.get(asObject);
    if (previous !== undefined) return { [TAG]: "ref", path: previous } satisfies Tagged;
    seen.set(asObject, path);

    if (value instanceof Date) {
      return { [TAG]: "date", iso: value.toISOString() } satisfies Tagged;
    }
    if (value instanceof RegExp) {
      return { [TAG]: "regexp", source: value.source, flags: value.flags } satisfies Tagged;
    }
    if (value instanceof Error) {
      return { [TAG]: "error", name: value.name, message: value.message } satisfies Tagged;
    }
    if (value instanceof Map) {
      const entries: Array<[unknown, unknown]> = [];
      let i = 0;
      for (const [k, v] of value) {
        entries.push([walk(k, `${path}/@k${i}`), walk(v, `${path}/${i}`)]);
        i += 1;
      }
      return { [TAG]: "map", entries } satisfies Tagged;
    }
    if (value instanceof Set) {
      const values: unknown[] = [];
      let i = 0;
      for (const v of value) {
        values.push(walk(v, `${path}/${i}`));
        i += 1;
      }
      return { [TAG]: "set", values } satisfies Tagged;
    }
    if (Array.isArray(value)) {
      return value.map((item, index) => walk(item, `${path}/${index}`));
    }

    const out: Record<string, unknown> = {};
    for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
      out[key] = walk(item, `${path}/${escapePointer(key)}`);
    }
    // An application object that happens to carry the marker key would decode as a tagged value
    // and come back as something else entirely. Wrap it so the decoder knows it is ordinary.
    if (TAG in out) return { [TAG]: "escaped", value: out } satisfies Tagged;
    return out;
  }

  const value = walk(input, "");
  return { value, report: { truncated, unsupported } };
}

/**
 * Reverses {@link encodeState}.
 *
 * @param input - A value produced by `encodeState` (typically after a JSON round trip).
 * @returns The original structure, with `Map`, `Set`, `Date` and friends restored.
 *
 * @remarks
 * Unsupported markers decode to `undefined`: a function cannot be reconstructed, and inventing a
 * placeholder would be worse than an absent value. Cycles are restored by resolving references
 * after the tree is built, so a decoded structure is cyclic exactly where the original was.
 *
 * @public
 */
export function decodeState(input: unknown): unknown {
  // Built during the walk so a reference can resolve to a node that may not exist yet.
  const byPath = new Map<string, unknown>();
  const pending: Array<{ target: unknown; key: string | number; path: string }> = [];

  function walk(value: unknown, path: string): unknown {
    if (value === null || typeof value !== "object") return value;

    if (Array.isArray(value)) {
      const arr: unknown[] = [];
      byPath.set(path, arr);
      value.forEach((item, index) => {
        if (isRef(item)) {
          // Left undefined for now; the second pass fills it once every node exists.
          pending.push({ target: arr, key: index, path: item.path });
          arr[index] = undefined;
          return;
        }
        arr[index] = walk(item, `${path}/${index}`);
      });
      return arr;
    }

    const tag = (value as Record<string, unknown>)[TAG];
    if (typeof tag === "string") {
      const tagged = value as unknown as Tagged;
      switch (tagged[TAG]) {
        case "undefined":
          return undefined;
        case "nan":
          return Number.NaN;
        case "infinity":
          return tagged.sign === 1 ? Infinity : -Infinity;
        case "bigint":
          return BigInt(tagged.value);
        case "date":
          return new Date(tagged.iso);
        case "regexp":
          return new RegExp(tagged.source, tagged.flags);
        case "error": {
          const error = new Error(tagged.message);
          error.name = tagged.name;
          return error;
        }
        case "unsupported":
          // Nothing faithful to return. `undefined` says "not representable" without pretending.
          return undefined;
        case "ref":
          // Resolved by the caller once the whole tree exists.
          return undefined;
        case "map": {
          const map = new Map<unknown, unknown>();
          byPath.set(path, map);
          tagged.entries.forEach(([k, v], index) => {
            map.set(walk(k, `${path}/@k${index}`), walk(v, `${path}/${index}`));
          });
          return map;
        }
        case "set": {
          const set = new Set<unknown>();
          byPath.set(path, set);
          tagged.values.forEach((v, index) => set.add(walk(v, `${path}/${index}`)));
          return set;
        }
        case "escaped":
          return walkPlain(tagged.value, path);
        default:
          return undefined;
      }
    }

    return walkPlain(value as Record<string, unknown>, path);
  }

  function walkPlain(value: Record<string, unknown>, path: string): Record<string, unknown> {
    const out: Record<string, unknown> = {};
    byPath.set(path, out);
    for (const [key, item] of Object.entries(value)) {
      const childPath = `${path}/${escapePointer(key)}`;
      if (isRef(item)) {
        pending.push({ target: out, key, path: item.path });
        out[key] = undefined;
        continue;
      }
      out[key] = walk(item, childPath);
    }
    return out;
  }

  const root = walk(input, "");
  byPath.set("", root);

  // Second pass: every reference now has a node to point at.
  for (const { target, key, path } of pending) {
    (target as Record<string | number, unknown>)[key] = byPath.get(path);
  }

  return root;
}

/** @internal */
function isRef(value: unknown): value is { [TAG]: "ref"; path: string } {
  return (
    value !== null &&
    typeof value === "object" &&
    (value as Record<string, unknown>)[TAG] === "ref" &&
    typeof (value as Record<string, unknown>).path === "string"
  );
}

/**
 * Escapes a key for use in a JSON Pointer segment (RFC 6901).
 *
 * @internal
 */
function escapePointer(key: string): string {
  return key.replace(/~/g, "~0").replace(/\//g, "~1");
}

/** Outcome of {@link encodeStateBounded}. */
export interface BoundedEncodeResult {
  /** The encoded value, small enough to send. */
  readonly value: unknown;
  /** `true` when the state did not fit and parts were replaced by markers. */
  readonly truncated: boolean;
  /** Explains what was dropped, for display beside a partial tree. */
  readonly note?: string;
}

/**
 * Encodes a value, shrinking it until its serialized form fits within `maxBytes`.
 *
 * @param input - Any value.
 * @param maxBytes - Byte budget for the serialized form.
 * @param options - Passed through to {@link encodeState}.
 *
 * @returns The encoded value and whether anything had to be dropped.
 *
 * @remarks
 * A frame larger than the hub's cap is not merely slow — it is rejected, and the connection with
 * it, so the client reconnects, asks again, is refused again, and the panel sits waiting through
 * a loop with nothing on screen to explain it. The size therefore has to be bounded before the
 * frame is sent rather than discovered afterwards.
 *
 * Node count is a poor proxy for bytes: a hundred nodes holding base64 blobs outweigh a hundred
 * thousand holding integers. So this measures the encoded output and, when it is too large,
 * scales the node budget by how far over it went and measures again. Scaling by the overshoot
 * rather than halving matters: from a default of a hundred thousand nodes, repeated halving
 * needs a dozen rounds to reach the hundreds, so a state that could have been shown in part
 * would have been abandoned instead.
 *
 * Truncation is reported rather than performed silently. A partial tree presented as the state is
 * worse than no tree at all: a debugger that quietly lies about state is not a debugger.
 *
 * @public
 */
export function encodeStateBounded(
  input: unknown,
  maxBytes: number,
  options: EncodeOptions = {},
): BoundedEncodeResult {
  let nodeBudget = options.maxNodes ?? 100_000;

  for (let attempt = 0; attempt < 8; attempt += 1) {
    const { value, report } = encodeState(input, { ...options, maxNodes: nodeBudget });
    // `JSON.stringify` can still refuse a value the encoder passed through untouched, so a
    // failure here is measured as "does not fit" rather than thrown at the caller.
    let size: number;
    try {
      size = JSON.stringify(value)?.length ?? 0;
    } catch {
      size = Number.POSITIVE_INFINITY;
    }

    if (size <= maxBytes) {
      return report.truncated
        ? {
            value,
            truncated: true,
            note: `State was too large to send in full; parts beyond ${nodeBudget} nodes are omitted.`,
          }
        : { value, truncated: false };
    }

    // Aim at 80% of the budget so the next attempt has room for the tagging overhead that
    // shrinking cannot remove, and always make progress even when the estimate is optimistic.
    const scaled = Math.floor((nodeBudget * maxBytes * 0.8) / size);
    nodeBudget = Math.max(1, Math.min(scaled, nodeBudget - 1));
    if (nodeBudget <= 1 && attempt > 0) {
      // Already at the floor and still too large: the remaining bytes are one enormous value,
      // not many small ones, and no node budget will cut it down.
      break;
    }
  }

  // Nothing fit, even at the smallest budget. Say so instead of sending a frame that will be
  // refused and leaving the panel to retry against a wall.
  return {
    value: { [TAG]: "unsupported", kind: "truncated" } satisfies Tagged,
    truncated: true,
    note: `State exceeds the ${maxBytes}-byte transport limit and could not be reduced to fit.`,
  };
}
