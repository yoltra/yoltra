/**
 * Building the slice of state a component actually declared.
 *
 * @remarks
 * `useAtomicProps` used to take two independent arguments: a list of paths that wake the
 * component, and a selector handed the *entire* state. Nothing tied them together, so
 * declaring one path and reading another compiled, ran, and worked — until the day the two
 * stopped changing together. This repository shipped that bug in its own example: a list
 * subscribed to `todo.filter` while reading `todo.data`, and re-rendered only because adding a
 * todo happened to rewrite `filter.categories` too.
 *
 * The fix is not to detect the mismatch but to remove the opportunity. The selector is handed
 * a projection containing the declared paths and nothing else, so reading undeclared state is
 * no longer a mistake that can be made silently — it reads `undefined` immediately, on the
 * first render, instead of a correct value that goes stale later.
 *
 * In development it does better than `undefined`: the projection is wrapped in a guard that
 * throws and names the path, because a `TypeError` three frames downstream is a poor way to
 * learn you forgot a subscription.
 *
 * @module @yoltra/react
 */

import { getAtPath, hasWildcard } from "./path";

/** A declared subscription, already normalized. */
export interface DeclaredPath {
  readonly reducer: string;
  /** Dotted path within the reducer's slice. `""` means the whole slice. */
  readonly property: string;
}

/** @internal */
function isObjectLike(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

/**
 * Expands a wildcard path against real state into the concrete paths it currently matches.
 *
 * @remarks
 * Expanded rather than approximated. Handing the selector everything under the pattern's
 * static prefix would be simpler and would quietly reopen the hole: a component subscribed to
 * `items.*.done` would be able to read `items.0.title`, which is the same bug one level down.
 *
 * `*` matches one segment, `**` matches any number.
 *
 * @internal
 */
export function expandPattern(root: unknown, pattern: string): string[] {
  const segments = pattern.split(".");
  const found: string[] = [];

  const walk = (node: unknown, index: number, trail: string[]): void => {
    if (index === segments.length) {
      found.push(trail.join("."));
      return;
    }
    const segment = segments[index]!;

    if (segment === "**") {
      // Zero segments, then one or more.
      walk(node, index + 1, trail);
      if (!isObjectLike(node)) return;
      for (const key of Object.keys(node)) walk(node[key], index, [...trail, key]);
      return;
    }

    if (segment === "*") {
      if (!isObjectLike(node)) return;
      for (const key of Object.keys(node)) walk(node[key], index + 1, [...trail, key]);
      return;
    }

    if (!isObjectLike(node)) return;
    if (!Object.prototype.hasOwnProperty.call(node, segment)) return;
    walk(node[segment], index + 1, [...trail, segment]);
  };

  walk(root, 0, []);
  return found;
}

/**
 * Containers this module created, and may therefore write into.
 *
 * @remarks
 * A container that came from state must never be written to. A glob expands to the container
 * path *and* the paths beneath it, so `satellites.**` assigns the real array at `satellites`
 * and then tries to write `satellites.0` into it. State is frozen in development, so that
 * threw `Cannot assign to read only property '0'`; in production it would silently mutate the
 * store's own state, which is worse. Either way the container has to be copied first.
 *
 * @internal
 */
const owned = new WeakSet<object>();

/** @internal */
function assignAtPath(target: Record<string, unknown>, source: unknown, path: string[], value: unknown): void {
  if (path.length === 0) return;

  let cursor: Record<string, unknown> = target;
  let origin: unknown = source;

  for (let i = 0; i < path.length - 1; i++) {
    const key = path[i]!;
    const nextOrigin = isObjectLike(origin) ? origin[key] : undefined;
    const existing = cursor[key];

    if (!isObjectLike(existing)) {
      // Mirror the container kind, so a declared `items.0.title` still hands the selector an
      // array rather than an object with a "0" key. `map` and `Object.values` on it would
      // otherwise behave differently from the real state for no reason the caller can see.
      const fresh = (Array.isArray(nextOrigin) ? [] : {}) as Record<string, unknown>;
      owned.add(fresh);
      cursor[key] = fresh;
    } else if (!owned.has(existing as object)) {
      // Borrowed from state by a shallower declaration. Shallow-copy it so the contents
      // survive and the deeper write lands somewhere we are allowed to touch.
      const copy = (
        Array.isArray(existing)
          ? [...(existing as unknown[])]
          : { ...(existing as Record<string, unknown>) }
      ) as Record<string, unknown>;
      owned.add(copy);
      cursor[key] = copy;
    }

    cursor = cursor[key] as Record<string, unknown>;
    origin = nextOrigin;
  }

  cursor[path[path.length - 1]!] = value;
}

/**
 * Builds the projection of `state` that `declared` covers.
 *
 * @remarks
 * Leaves are copied by reference, so nothing is cloned and identity-based memoization
 * downstream keeps working. Only the containers needed to reach a declared leaf are rebuilt.
 *
 * A declared path that does not exist in state is still written, as `undefined`. That keeps
 * "declared but absent" distinguishable from "never declared", which is what lets the
 * development guard tell a missing subscription from a missing value.
 */
export function projectDeclared(
  state: unknown,
  declared: readonly DeclaredPath[],
): Record<string, unknown> {
  const projection: Record<string, unknown> = {};

  for (const { reducer, property } of declared) {
    const slice = isObjectLike(state) ? state[reducer] : undefined;

    if (property === "") {
      projection[reducer] = slice;
      continue;
    }

    const concrete = hasWildcard(property) ? expandPattern(slice, property) : [property];
    for (const path of concrete) {
      assignAtPath(projection, state, [reducer, ...path.split(".")], getAtPath(slice, path));
    }
  }

  return projection;
}

/**
 * A shallow, extensible copy of a frozen object, for use as a proxy target.
 *
 * @remarks
 * A `get` trap may not return a wrapper in place of an own data property that is non-writable
 * *and* non-configurable, which is exactly the pair `Object.freeze` produces. The engine raises
 * `TypeError: 'get' on proxy: property 'x' is a read-only and non-configurable data property on
 * the proxy target but the proxy did not return its actual value` before any code here runs, so
 * the stack trace names the component that read the property and nothing in this package.
 *
 * Frozen state is the ordinary case, not an exotic one: immer's `produce` auto-freezes what it
 * returns, and `@yoltra/core` exports a `deepFreeze` for the same purpose. So the guard has to be
 * built over a copy whose properties are configurable, and the copy is what makes returning a
 * nested guard legal.
 *
 * Only reached when the object is frozen, and only in development, where this guard runs at all.
 * The copy is shallow: nested values are still the frozen originals, each thawed in turn if a
 * read goes through it.
 *
 * @internal
 */
function thaw(source: Record<string, unknown>): Record<string, unknown> {
  // A spread rather than a descriptor copy: `getOwnPropertyDescriptors` would carry
  // `writable: false, configurable: false` straight back onto the copy and change nothing.
  return { ...source };
}

/**
 * Wraps a projection so an undeclared read throws instead of yielding `undefined`.
 *
 * @remarks
 * Development only, and worth the cost there: without it the symptom of a missing subscription
 * is `undefined` reaching application code, which surfaces as a `TypeError` somewhere further
 * down with nothing pointing back at the declaration that was never written.
 *
 * @internal
 */
export function guardProjection(
  projection: Record<string, unknown>,
  declared: readonly DeclaredPath[],
  trail: string[] = [],
): Record<string, unknown> {
  const describe = (): string =>
    declared.map((d) => `{ reducer: "${d.reducer}", property: "${d.property}" }`).join(", ");

  // The target, not `projection` itself: see `thaw`. A frozen object read through this trap is a
  // `TypeError` from the engine, and freezing is what any ordinary reducer does.
  const base = Object.isFrozen(projection) ? thaw(projection) : projection;

  return new Proxy(base, {
    get(target, key, receiver) {
      if (typeof key === "symbol" || key === "toJSON" || key === "constructor") {
        return Reflect.get(target, key, receiver);
      }
      if (!Object.prototype.hasOwnProperty.call(target, key)) {
        const path = [...trail, String(key)].join(".");
        throw new Error(
          `[yoltra] useAtomicProps read "${path}", which it did not subscribe to. The ` +
            `selector only receives the paths declared alongside it, so this read would be ` +
            `\`undefined\` in production and the component would never re-render when it ` +
            `changed. Declared: [${describe()}]. Add "${path}" to the list, or stop reading it.`,
        );
      }
      const value = Reflect.get(target, key, receiver) as unknown;
      return isObjectLike(value) && !Array.isArray(value)
        ? guardProjection(value as Record<string, unknown>, declared, [...trail, String(key)])
        : value;
    },
    has: (target, key) => Reflect.has(target, key),
  });
}
