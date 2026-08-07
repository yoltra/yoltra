/**
 * Which panel tabs a store can actually serve.
 *
 * @remarks
 * Extracted from the app component so it can be tested directly: the rule is small but it
 * decides what a user is allowed to click, and inside a component it can only be reached by
 * rendering the whole panel against a mock hub.
 *
 * @module @yoltra/devtools-storeview
 */

import type { StoreCapabilities } from "@yoltra/devtools-protocol";

/** Panel tabs, in display order. */
export const TABS = ["Inspector", "State", "Time Travel", "Metrics"] as const;

/** A panel tab name. */
export type TabName = (typeof TABS)[number];

/**
 * `true` when `tab` can be served by a store with these capabilities.
 *
 * @param tab - Tab to test.
 * @param caps - The selected store's capabilities, or `null` when none is selected.
 *
 * @remarks
 * Inspector and Metrics need nothing: the event stream and the counters arrive whether or not a
 * store will answer a snapshot request. State needs `stateSnapshot`, and Time Travel needs
 * `replay` — both default to off, and offering a tab that silently does nothing is worse than
 * not offering it.
 *
 * @public
 */
export function tabRequires(tab: TabName, caps: StoreCapabilities | null): boolean {
  switch (tab) {
    case "Inspector":
    case "Metrics":
      return true;
    case "State":
      return caps?.stateSnapshot ?? false;
    case "Time Travel":
      return caps?.replay ?? false;
  }
}

/**
 * Picks the tab to show, keeping the current one when the store still supports it.
 *
 * @param current - Tab the user last chose.
 * @param caps - Capabilities of the newly selected store.
 * @returns `current` when it is still available, otherwise the always-available fallback.
 *
 * @remarks
 * Switching stores is where this matters: a panel left on Time Travel and pointed at a store
 * that cannot replay would otherwise sit on a tab whose controls do nothing.
 *
 * @public
 */
export function resolveTab(current: TabName, caps: StoreCapabilities | null): TabName {
  return tabRequires(current, caps) ? current : "Inspector";
}
