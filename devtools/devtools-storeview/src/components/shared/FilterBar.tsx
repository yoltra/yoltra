/**
 * @module @yoltra/devtools-storeview
 */

import styles from "../../styles/panels/EventTimeline.module.css";

/**
 * Filter bar with text input and optional toggle buttons.
 *
 * Provides a text field for `channel::type` filtering and optional
 * Committed / Bounced toggle buttons for event status filtering.
 *
 * @param props.value - Current filter text.
 * @param props.onChange - Callback when the filter text changes.
 * @param props.placeholder - Placeholder string for the text input.
 * @param props.showCommitted - Whether the Committed toggle is active.
 * @param props.showBounced - Whether the Bounced toggle is active.
 * @param props.onToggleCommitted - Callback to toggle committed visibility.
 * @param props.onToggleBounced - Callback to toggle bounced visibility.
 * @public
 */
export function FilterBar({
  value,
  onChange,
  placeholder,
  showCommitted,
  showBounced,
  onToggleCommitted,
  onToggleBounced,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  showCommitted?: boolean;
  showBounced?: boolean;
  onToggleCommitted?: () => void;
  onToggleBounced?: () => void;
}) {
  return (
    <div className={styles.filterBar}>
      <input
        className={styles.filterInput}
        type='text'
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? "Filter by channel::type..."}
      />
      {onToggleCommitted && (
        <button
          className={`${styles.filterToggle} ${showCommitted ? styles.filterToggleActive : ""}`}
          onClick={onToggleCommitted}
          title='Show committed events'
        >
          Committed
        </button>
      )}
      {onToggleBounced && (
        <button
          className={`${styles.filterToggle} ${showBounced ? styles.filterToggleActive : ""}`}
          onClick={onToggleBounced}
          title='Show bounced events'
        >
          Bounced
        </button>
      )}
    </div>
  );
}
