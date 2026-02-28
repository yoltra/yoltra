/**
 * @module @yoltra/devtools-storeview
 */

import type { RegisteredStore } from "@yoltra/devtools-ui";
import { ConnectionDot } from "../shared/ConnectionDot";

const containerStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  height: "var(--devtools-topbar-height)",
  background: "var(--devtools-bg-secondary)",
  borderBottom: "1px solid var(--devtools-border)",
  padding: "0 var(--devtools-spacing-md)",
  gap: "var(--devtools-spacing-sm)",
  flexShrink: 0,
};

const tabStyle = (active: boolean): React.CSSProperties => ({
  display: "flex",
  alignItems: "center",
  gap: "var(--devtools-spacing-sm)",
  padding: "var(--devtools-spacing-xs) var(--devtools-spacing-md)",
  background: active ? "var(--devtools-bg-active)" : "transparent",
  border: "none",
  borderRadius: "var(--devtools-radius)",
  color: active ? "var(--devtools-fg)" : "var(--devtools-fg-secondary)",
  cursor: "pointer",
  fontSize: "var(--devtools-font-size-sm)",
  fontFamily: "inherit",
});

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
    <header style={containerStyle}>
      {stores.map((store) => (
        <button
          key={store.id}
          style={tabStyle(store.id === selectedStoreId)}
          onClick={() => onSelectStore(store.id)}
        >
          <ConnectionDot status={store.status} />
          {store.name}
        </button>
      ))}
      {stores.length === 0 && (
        <span
          style={{
            color: "var(--devtools-fg-muted)",
            fontSize: "var(--devtools-font-size-sm)",
          }}
        >
          No stores connected
        </span>
      )}
    </header>
  );
}
