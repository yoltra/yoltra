import type { SnapshotSerializer } from "vitest";

/**
 * Renumbers React's generated ids per snapshot, so one snapshot cannot churn another.
 *
 * @remarks
 * `useId` produces `«r0»`, `«r1»` and so on from a counter that is global to the module, not local
 * to the render. Adding a `useId` to any component shifts every id generated after it, which meant
 * giving `Tabs` its ARIA wiring rewrote the Dialog, Drawer, Popover, Menu, ContextMenu and Tooltip
 * snapshots as well: nineteen failures, of which two were the change and seventeen were noise.
 *
 * Snapshots that churn for unrelated reasons stop being read, so the offset is normalised away.
 * The ids are renumbered rather than blanked, so `aria-labelledby="«id0»-title"` pointing at
 * `id="«id0»-title"` is still visible in the recorded output: what a reader loses is the global
 * counter's value, which never carried meaning.
 */

const GENERATED = /«r\d+»/g;

/** Guards the delegation below: the default printer would otherwise re-enter this serializer. */
let printing = false;

const serializer: SnapshotSerializer = {
  test: (value: unknown) =>
    !printing && typeof value === "object" && value !== null && "nodeType" in value,

  serialize(value, config, indentation, depth, refs, printer) {
    printing = true;
    try {
      const printed = printer(value, config, indentation, depth, refs);
      const seen = new Map<string, string>();
      return printed.replace(GENERATED, (match) => {
        if (!seen.has(match)) seen.set(match, `«id${seen.size}»`);
        return seen.get(match)!;
      });
    } finally {
      printing = false;
    }
  },
};

export default serializer;
