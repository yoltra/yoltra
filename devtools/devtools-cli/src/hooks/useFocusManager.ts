/**
 * @module @yoltra/devtools-cli
 */

import { useCallback, useState } from "react";

const TABS = ["Events", "State", "Subscriptions", "Metrics", "Emit"] as const;

/**
 * Union type of available CLI panel tab names.
 *
 * @public
 */
export type TabName = (typeof TABS)[number];

/**
 * Manages active tab and store focus for the CLI.
 *
 * Tracks the currently selected panel tab and store index, providing
 * `nextTab` / `prevTab` and `nextStore` / `prevStore` helpers that
 * wrap around the available items.
 *
 * @returns An object containing the active tab, selected store index,
 *          navigation helpers, and the ordered tab list.
 * @public
 */
export function useFocusManager() {
  const [activeTab, setActiveTab] = useState<TabName>("Events");
  const [selectedStoreIndex, setSelectedStoreIndex] = useState(0);

  const nextTab = useCallback(() => {
    setActiveTab((current) => {
      const idx = TABS.indexOf(current);
      return TABS[(idx + 1) % TABS.length];
    });
  }, []);

  const prevTab = useCallback(() => {
    setActiveTab((current) => {
      const idx = TABS.indexOf(current);
      return TABS[(idx - 1 + TABS.length) % TABS.length];
    });
  }, []);

  const nextStore = useCallback((storeCount: number) => {
    setSelectedStoreIndex((i) => (i + 1) % Math.max(1, storeCount));
  }, []);

  const prevStore = useCallback((storeCount: number) => {
    setSelectedStoreIndex((i) => (i - 1 + Math.max(1, storeCount)) % Math.max(1, storeCount));
  }, []);

  return {
    activeTab,
    setActiveTab,
    selectedStoreIndex,
    setSelectedStoreIndex,
    nextTab,
    prevTab,
    nextStore,
    prevStore,
    tabs: TABS,
  };
}
