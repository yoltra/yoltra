/**
 * Pure formatting helpers for the {@link Inspector} detail pane. Kept separate
 * from the component so they can be unit-tested without pulling in React.
 *
 * @module @yoltra/devtools-storeview
 */

/**
 * Turn an RFC-6902 JSON Pointer (`/fleet/satellites/0/battery`) into the
 * dotted leaf path Yoltra developers actually think in
 * (`fleet.satellites.0.battery`), unescaping `~1` → `/` and `~0` → `~`.
 *
 * The empty pointer and `/` both denote the document root.
 *
 * @param pointer - An RFC-6902 JSON Pointer.
 * @returns The dotted path, or `"(root)"` for the whole-document pointer.
 * @public
 */
export function formatPointer(pointer: string): string {
  if (!pointer || pointer === "/") return "(root)";
  return pointer
    .replace(/^\//, "")
    .split("/")
    .map((seg) => seg.replace(/~1/g, "/").replace(/~0/g, "~"))
    .join(".");
}

/**
 * Compact, truncated single-line preview of a patch/leaf value.
 *
 * @param value - Any JSON-serializable (or not) value.
 * @param maxLength - Truncation threshold; longer strings gain an ellipsis.
 * @returns A short string preview.
 * @public
 */
export function formatValue(value: unknown, maxLength = 80): string {
  if (value === undefined) return "undefined";
  let s: string;
  try {
    s = JSON.stringify(value) ?? String(value);
  } catch {
    s = String(value);
  }
  return s.length > maxLength ? `${s.slice(0, maxLength)}…` : s;
}
