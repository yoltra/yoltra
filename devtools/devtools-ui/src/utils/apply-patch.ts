/**
 * Immutable RFC 6902 JSON Patch utility used by the DevTools UI state hooks.
 *
 * @remarks
 * This module provides a minimal, dependency-free implementation of the
 * `add`, `remove`, and `replace` JSON Patch operations. It is used
 * internally by {@link useStoreState} to apply incremental state patches
 * received from the hub without mutating the existing state tree.
 *
 * @module @yoltra/devtools-ui
 */

import type { JsonPatch } from "@yoltra/devtools-protocol";

/**
 * Apply an array of RFC 6902 JSON Patch operations to a value.
 * Returns a new object -- does not mutate the input.
 *
 * @remarks
 * Only the `add`, `remove`, and `replace` operations are implemented because
 * the v1 devtools protocol does not emit `move`, `copy`, or `test` patches.
 * Each operation is applied sequentially in array order. Path segments are
 * resolved according to RFC 6901 (JSON Pointer), including `~0` / `~1`
 * escape handling.
 *
 * @example
 * ```ts
 * import { applyPatches } from "@yoltra/devtools-ui";
 *
 * const next = applyPatches(
 *   { counter: { value: 0 } },
 *   [{ op: "replace", path: "/counter/value", value: 1 }],
 * );
 * // next => { counter: { value: 1 } }
 * ```
 *
 * @param target - The value to patch.
 * @param patches - RFC 6902 operations.
 * @returns A new patched value.
 *
 * @public
 */
export function applyPatches<T = unknown>(target: T, patches: JsonPatch[]): T {
  let result: any = structuredClone(target);

  for (const patch of patches) {
    const segments = parsePointer(patch.path);
    switch (patch.op) {
      case "add":
      case "replace":
        result = setAtPath(result, segments, patch.value);
        break;
      case "remove":
        result = removeAtPath(result, segments);
        break;
      // move, copy, test — not used in v1 protocol
    }
  }

  return result;
}

/**
 * Parse a JSON Pointer (RFC 6901) into path segments.
 *
 * @remarks
 * Handles `~0` and `~1` escape sequences as specified by RFC 6901.
 * E.g., `"/counter/value"` becomes `["counter", "value"]`.
 *
 * @param pointer - A JSON Pointer string (e.g. `"/a/b/c"`).
 * @returns An array of unescaped path segments.
 *
 * @internal
 */
function parsePointer(pointer: string): string[] {
  if (pointer === "" || pointer === "/") return [];
  return pointer
    .slice(1) // Remove leading "/"
    .split("/")
    .map((s) => s.replace(/~1/g, "/").replace(/~0/g, "~"));
}

/**
 * Immutably set a value at the given path segments within an object or array.
 *
 * @param obj - The root object.
 * @param segments - Path segments produced by {@link parsePointer}.
 * @param value - The value to set.
 * @returns A shallow-cloned tree with the value set.
 *
 * @internal
 */
function setAtPath(obj: any, segments: string[], value: unknown): any {
  if (segments.length === 0) return value;

  const result = Array.isArray(obj) ? [...obj] : { ...obj };
  const [head, ...rest] = segments;

  if (rest.length === 0) {
    result[head] = value;
  } else {
    result[head] = setAtPath(result[head] ?? {}, rest, value);
  }

  return result;
}

/**
 * Immutably remove the value at the given path segments within an object or array.
 *
 * @param obj - The root object.
 * @param segments - Path segments produced by {@link parsePointer}.
 * @returns A shallow-cloned tree with the value removed.
 *
 * @internal
 */
function removeAtPath(obj: any, segments: string[]): any {
  if (segments.length === 0) return undefined;

  const result = Array.isArray(obj) ? [...obj] : { ...obj };
  const [head, ...rest] = segments;

  if (rest.length === 0) {
    if (Array.isArray(result)) {
      result.splice(Number(head), 1);
    } else {
      delete result[head];
    }
  } else {
    result[head] = removeAtPath(result[head], rest);
  }

  return result;
}
