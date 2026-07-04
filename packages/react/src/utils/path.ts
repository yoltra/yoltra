import { warnOnce } from "./warnOnce";

/** @internal */
export function hasWildcard(p: string): boolean {
  return p.includes("*");
}

/** @internal */
export function normalizePath(p: string): string {
  return p.replace(/^\./, "");
}

/** @internal */
export function splitPath(p: string): string[] {
  return normalizePath(p).split(".").filter(Boolean);
}

/**
 * Stable signature for a specs array, for use as a `useMemo` dependency instead
 * of `JSON.stringify` — deterministic and avoids serializing arbitrary values.
 * Reducer names and dotted paths never contain the `:`/`,`/`|` delimiters, so
 * the signature is collision-free for realistic inputs.
 * @internal
 */
export function specsSignature(
  specs: ReadonlyArray<{ reducer: string; property: string | readonly string[] }>,
): string {
  return specs
    .map((s) => {
      const prop = Array.isArray(s.property)
        ? (s.property as readonly string[]).join(",")
        : (s.property as string);
      return `${s.reducer}:${prop}`;
    })
    .join("|");
}

const PATH_SEGMENTS = Symbol("yoltra.pathSegments");

function makePathProxy(segments: string[]): unknown {
  // The target is a function so that *calling* the proxy hits the `apply` trap
  // (a plain-object target is simply not callable and throws an opaque
  // "x is not a function"). This lets us reject method calls inside an accessor
  // — e.g. `p => p.items.map(...)` — with a message that says what went wrong.
  const target = () => undefined;
  return new Proxy(target, {
    get(_target, prop) {
      if (prop === PATH_SEGMENTS) return segments;
      if (typeof prop === "symbol") return undefined;
      return makePathProxy([...segments, String(prop)]);
    },
    apply() {
      throw new Error(
        `[yoltra] A typed path accessor called a method (near "${segments.join(".")}"). ` +
          "The accessor must be a plain member chain like `p => p.items[0].title` — it cannot " +
          "call functions such as `.map()` or `.toString()`. Compute derived values in the " +
          "component or a selector, or use the `{ reducer, property }` string form.",
      );
    },
  });
}

/**
 * Converts a typed path accessor (e.g. `p => p.items[0].title`) into a dotted
 * path string (`"items.0.title"`) by recording property accesses on a proxy.
 *
 * The accessor **must be a pure member chain**. It cannot return a computed
 * value (`p => p.a.b ?? 0`, `p => 5`) or call a method (`p => p.items.map(...)`):
 * - a method call throws immediately (see the proxy's `apply` trap);
 * - anything that records no property access yields an empty path — which would
 *   silently subscribe to the whole slice — so we `warnOnce` in dev.
 *
 * @internal
 */
export function toDottedPath(accessor: (p: any) => any): string {
  const leaf = accessor(makePathProxy([]));
  const recorded = leaf != null ? (leaf as any)[PATH_SEGMENTS] : undefined;
  const segments: string[] = Array.isArray(recorded) ? recorded : [];
  const path = segments.join(".");

  if (path === "") {
    warnOnce(
      "yoltra.toDottedPath.empty",
      "[yoltra] A typed path accessor recorded no property access, so it will subscribe to the " +
        "entire slice. The accessor must be a plain member chain like `p => p.items[0].title` and " +
        "cannot return a computed value or a default. For a whole-slice or dynamic subscription, " +
        "use the `{ reducer, property }` string form instead.",
    );
  }

  return path;
}

/**
 * Reads a dotted path from an object; returns `undefined` when a segment is missing.
 * @internal
 */
export function getAtPath(obj: any, path: string): any {
  if (!path) return obj;

  let cur = obj;
  for (const seg of splitPath(path)) {
    if (cur == null) return undefined;
    cur = cur[seg];
  }

  return cur;
}
