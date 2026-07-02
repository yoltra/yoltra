/**
 * @module @yoltra/devtools-protocol
 */

import type { JsonPatch } from "./json-patch";

/**
 * Walks a dotted path (e.g., `"counter.value"`) into an object.
 *
 * @remarks
 * Used internally by {@link computePatches} to read old/new values
 * from state trees. Returns `undefined` when any intermediate
 * segment is `null` or `undefined`.
 *
 * @example
 * ```ts
 * import { getAtPath } from "@yoltra/devtools-protocol";
 *
 * const state = { counter: { value: 10 } };
 * getAtPath(state, "counter.value"); // 10
 * getAtPath(state, "missing.key");   // undefined
 * ```
 *
 * @param obj - Root object to traverse.
 * @param dottedPath - Dot-separated path string.
 * @returns The value at the path, or `undefined` if unreachable.
 *
 * @public
 */
export function getAtPath(obj: any, dottedPath: string): any {
  if (!dottedPath) return obj;
  const parts = dottedPath.split(".");
  let cur = obj;
  for (const seg of parts) {
    if (cur == null) return undefined;
    cur = cur[seg];
  }
  return cur;
}

/**
 * Converts `detectChangedProps` output (dotted leaf paths) into
 * RFC 6902 JSON Patch operations.
 *
 * @remarks
 * - Dotted paths like `"counter.value"` become JSON Pointers `"/counter/value"`.
 * - Determines `add`, `remove`, or `replace` by comparing old/new values at each path.
 * - Assumes property names do not contain `/` or `~` (safe for Yoltra state shapes).
 *
 * This is the primary bridge between Yoltra internal change-detection and the
 * RFC 6902 patch format carried inside {@link StoreEvent} messages.
 *
 * @example
 * ```ts
 * import { computePatches } from "@yoltra/devtools-protocol";
 *
 * const prev = { counter: { value: 1 } };
 * const next = { counter: { value: 2 } };
 * const patches = computePatches(prev, next, ["counter.value"]);
 * // [{ op: "replace", path: "/counter/value", value: 2 }]
 * ```
 *
 * @param prevState - State before the event.
 * @param nextState - State after the event.
 * @param changedPaths - Array of dotted leaf paths from `detectChangedProps`.
 * @returns Array of {@link JsonPatch} operations describing the state transition.
 *
 * @public
 */
export function computePatches(
  prevState: any,
  nextState: any,
  changedPaths: string[],
): JsonPatch[] {
  const patches: JsonPatch[] = [];
  for (const dottedPath of changedPaths) {
    const pointer = "/" + dottedPath.replace(/\./g, "/");
    const oldVal = getAtPath(prevState, dottedPath);
    const newVal = getAtPath(nextState, dottedPath);

    if (oldVal === undefined && newVal !== undefined) {
      patches.push({ op: "add", path: pointer, value: newVal });
    } else if (oldVal !== undefined && newVal === undefined) {
      patches.push({ op: "remove", path: pointer });
    } else {
      patches.push({ op: "replace", path: pointer, value: newVal });
    }
  }
  return patches;
}

/**
 * Builds RFC 6902 JSON Patch operations directly from a core
 * `InstrumentedEvent`: the changed dotted leaf paths plus their old/new values.
 *
 * @remarks
 * This is the preferred bridge now that the core reports exact changed paths and
 * values per event — no full-state diff or clone is required. Op is chosen per
 * path the same way as {@link computePatches}. Assumes property names do not
 * contain `/` or `~` (safe for Yoltra state shapes).
 *
 * @param changedPaths - Dotted leaf paths that changed (slice-prefixed).
 * @param prevValues - Old value at each changed path, keyed by path.
 * @param nextValues - New value at each changed path, keyed by path.
 * @returns Array of {@link JsonPatch} operations describing the state transition.
 *
 * @public
 */
export function patchesFromChange(
  changedPaths: string[],
  prevValues: Record<string, unknown>,
  nextValues: Record<string, unknown>,
): JsonPatch[] {
  const patches: JsonPatch[] = [];
  for (const dottedPath of changedPaths) {
    const pointer = "/" + dottedPath.replace(/\./g, "/");
    const oldVal = prevValues[dottedPath];
    const newVal = nextValues[dottedPath];

    if (oldVal === undefined && newVal !== undefined) {
      patches.push({ op: "add", path: pointer, value: newVal });
    } else if (oldVal !== undefined && newVal === undefined) {
      patches.push({ op: "remove", path: pointer });
    } else {
      patches.push({ op: "replace", path: pointer, value: newVal });
    }
  }
  return patches;
}
