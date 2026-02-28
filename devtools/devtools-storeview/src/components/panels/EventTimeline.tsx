/**
 * @module @yoltra/devtools-storeview
 */

import type { EventLogEntry } from "@yoltra/devtools-ui";
import { useMemo, useState } from "react";
import styles from "../../styles/panels/EventTimeline.module.css";
import { FilterBar } from "../shared/FilterBar";
import { JsonTree } from "../shared/JsonTree";

/**
 * Scrollable event timeline with filtering and detail inspection.
 *
 * Lists all event log entries with committed/bounced status indicators,
 * channel, type, truncated payload preview, and timestamp. Supports
 * text filtering by `channel::type` and committed/bounced toggles via
 * the embedded {@link FilterBar}. Selecting a row expands a
 * {@link JsonTree} detail view of the full entry.
 *
 * @param props.entries - Array of event log entries to display.
 * @param props.onSelectEntry - Optional callback when an entry row is clicked.
 * @public
 */
export function EventTimeline({
  entries,
  onSelectEntry,
}: {
  entries: EventLogEntry[];
  onSelectEntry?: (entry: EventLogEntry, index: number) => void;
}) {
  const [filter, setFilter] = useState("");
  const [showCommitted, setShowCommitted] = useState(true);
  const [showBounced, setShowBounced] = useState(true);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const filtered = useMemo(() => {
    return entries.filter((e) => {
      if (!showCommitted && e.committed) return false;
      if (!showBounced && !e.committed) return false;
      if (filter) {
        const key = `${e.event.channel}::${e.event.type}`;
        if (!key.toLowerCase().includes(filter.toLowerCase())) return false;
      }
      return true;
    });
  }, [entries, filter, showCommitted, showBounced]);

  const selectedEntry = selectedIndex != null ? filtered[selectedIndex] : null;

  return (
    <div className={styles.container}>
      <FilterBar
        value={filter}
        onChange={setFilter}
        showCommitted={showCommitted}
        showBounced={showBounced}
        onToggleCommitted={() => setShowCommitted((v) => !v)}
        onToggleBounced={() => setShowBounced((v) => !v)}
      />
      <div className={styles.list}>
        {filtered.map((entry, i) => (
          <div
            key={`${entry.event.id}-${i}`}
            className={`${styles.eventRow} ${i === selectedIndex ? styles.eventRowSelected : ""}`}
            onClick={() => {
              setSelectedIndex(i === selectedIndex ? null : i);
              onSelectEntry?.(entry, i);
            }}
          >
            <span
              className={`${styles.statusDot} ${
                entry.committed ? styles.statusDotCommitted : styles.statusDotBounced
              }`}
            />
            <span className={styles.channel}>{entry.event.channel}</span>
            <span className={styles.type}>{entry.event.type}</span>
            <span className={styles.payload}>
              {entry.event.payload != null
                ? JSON.stringify(entry.event.payload).slice(0, 80)
                : "—"}
            </span>
            <span className={styles.timestamp}>
              {new Date(entry.timestamp).toLocaleTimeString()}
            </span>
          </div>
        ))}
        {filtered.length === 0 && (
          <div
            className={styles.eventRow}
            style={{ justifyContent: "center", color: "var(--devtools-fg-muted)" }}
          >
            No events
          </div>
        )}
      </div>
      {selectedEntry && (
        <div className={styles.detail}>
          <JsonTree data={selectedEntry} name='event' defaultExpanded />
        </div>
      )}
    </div>
  );
}
