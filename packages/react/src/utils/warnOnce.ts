/**
 * @module @quojs/react
 */

/**
 * Set of warning keys already logged (to prevent spam).
 * @internal
 */
const warned = new Set<string>();

/**
 * Logs a warning **once** per unique key (dev only).
 *
 * @param key - Unique identifier for this warning.
 * @param message - Warning message to log.
 *
 * @remarks
 * - In production, this is a no-op.
 * - Useful for deprecation warnings that shouldn't flood the console.
 *
 * @example
 * ```ts
 * warnOnce('my-feature', 'This feature is deprecated.');
 * warnOnce('my-feature', 'This feature is deprecated.'); // no-op (already warned)
 * ```
 *
 * @internal
 */
export function warnOnce(key: string, message: string): void {
  if (process.env.NODE_ENV === "production") return;
  if (warned.has(key)) return;

  warned.add(key);
  console.warn(message);
}