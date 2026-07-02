/**
 * @module @yoltra/devtools-storeview
 */

import type { RegisteredStore } from "@yoltra/devtools-ui";
import { ConnectionDot } from "../shared/ConnectionDot";

/**
 * Top bar with store tabs and connection indicators.
 *
 * Renders a horizontal tab strip where each registered store is displayed
 * as a selectable button alongside a {@link ConnectionDot} reflecting its
 * live connection status.
 *
 * @param props.stores - Array of registered stores to display as tabs.
 * @param props.selectedStoreId - The currently selected store ID, or `null`.
 * @param props.onSelectStore - Callback invoked when a store tab is clicked.
 * @public
 */
export function TopBar({
  stores,
  selectedStoreId,
  onSelectStore,
}: {
  stores: RegisteredStore[];
  selectedStoreId: string | null;
  onSelectStore: (id: string) => void;
}) {
  return (
    <header>
      {stores.map((store) => (
        <button
          className={selectedStoreId === store.id ? "active" : ""}
          key={store.id}
          onClick={() => onSelectStore(store.id)}
        >
          <ConnectionDot status={store.status} />
          {store.name}
        </button>
      ))}
      {stores.length === 0 && <span>No stores connected</span>}
    </header>
  );
}
