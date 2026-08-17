/**
 * @module @yoltra/devtools-storeview
 */

import styles from "../../styles/panels/EventTimeline.module.css";

/**
 * Props for {@link FilterBar}.
 *
 * @public
 */
export interface FilterBarProps {
  /** Current filter text. */
  value: string;
  /** Callback when the filter text changes. */
  onChange: (value: string) => void;
  /** Placeholder string for the text input. */
  placeholder?: string;
  /** Whether the Committed toggle is active. */
  showCommitted?: boolean;
  /** Whether the Bounced toggle is active. */
  showBounced?: boolean;
  /** Callback to toggle committed visibility. */
  onToggleCommitted?: () => void;
  /** Callback to toggle bounced visibility. */
  onToggleBounced?: () => void;
}

/**
 * Filter bar with text input and optional toggle buttons.
 *
 * Provides a text field for `channel::type` filtering and optional
 * Committed / Bounced toggle buttons for event status filtering.
 *
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
}: FilterBarProps) {
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
