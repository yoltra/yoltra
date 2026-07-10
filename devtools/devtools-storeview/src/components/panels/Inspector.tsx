/**
 * @module @yoltra/devtools-storeview
 */

import type { EventLogEntry } from "@yoltra/devtools-ui";
import { useMemo, useState } from "react";
import { EventEmitterPanel } from "./EventEmitter";
import { formatPointer, formatValue } from "./inspectorFormat";
import { FilterBar } from "../shared/FilterBar";
import { JsonTree } from "../shared/JsonTree";
import styles from "./Inspector.module.css";

/**
 * The Inspector — the primary DevTools view.
 *
 * A scrollable, filterable event timeline paired with a detail pane for the
 * selected event. The detail pane foregrounds Yoltra's fine-grained story:
 * the exact **changed leaf paths** (from the event's RFC-6902 patches) and
 * their new values, plus the triggering payload. Middleware-vetoed events are
 * shown as such, with no state change.
 *
 * When the selected store allows it, an **Emit** action reveals an inline
 * composer for dispatching ad-hoc events.
 *
 * @param props.entries - Event log entries to display (newest last).
 * @param props.canEmit - Whether the store accepts emitted events.
 * @param props.onEmit - Callback to dispatch an event to the store.
 * @public
 */
export function Inspector({
  entries,
  canEmit = false,
  onEmit,
}: {
  entries: EventLogEntry[];
  canEmit?: boolean;
  onEmit?: (channel: string, type: string, payload: unknown) => void;
}) {
  const [filter, setFilter] = useState("");
  const [showCommitted, setShowCommitted] = useState(true);
  const [showBounced, setShowBounced] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [emitOpen, setEmitOpen] = useState(false);

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

  // Match the selected event by its stable id so selection survives new
  // events arriving and the list re-filtering.
  const selected = useMemo(
    () => filtered.find((e) => e.event.id === selectedId) ?? null,
    [filtered, selectedId],
  );

  return (
    <div className={styles.container}>
      <div className={styles.toolbar}>
        <div className={styles.filterWrap}>
          <FilterBar
            value={filter}
            onChange={setFilter}
            showCommitted={showCommitted}
            showBounced={showBounced}
            onToggleCommitted={() => setShowCommitted((v) => !v)}
            onToggleBounced={() => setShowBounced((v) => !v)}
          />
        </div>
        {canEmit && onEmit && (
          <button
            className={styles.emitButton}
            onClick={() => setEmitOpen((v) => !v)}
            title="Emit an event to this store"
          >
            {emitOpen ? "Close" : "+ Emit"}
          </button>
        )}
      </div>

      {emitOpen && canEmit && onEmit && (
        <div className={styles.emitPopover}>
          <EventEmitterPanel
            onEmit={(channel, type, payload) => {
              onEmit(channel, type, payload);
              setEmitOpen(false);
            }}
          />
        </div>
      )}

      <div className={styles.body}>
        <div className={styles.timeline}>
          {filtered.length === 0 ? (
            <div className={styles.timelineEmpty}>No events</div>
          ) : (
            filtered.map((entry) => {
              const isSelected = entry === selected;
              return (
                <button
                  key={entry.event.id}
                  className={`${styles.row} ${isSelected ? styles.rowSelected : ""}`}
                  onClick={() => setSelectedId(entry.event.id)}
                >
                  <span
                    className={`${styles.dot} ${
                      entry.committed ? styles.dotCommitted : styles.dotBounced
                    }`}
                  />
                  <span className={styles.channel}>{entry.event.channel}</span>
                  <span className={styles.type}>{entry.event.type}</span>
                  {entry.committed && entry.patches.length > 0 && (
                    <span className={styles.delta}>
                      {"Δ"}
                      {entry.patches.length}
                    </span>
                  )}
                  <span className={styles.time}>
                    {new Date(entry.timestamp).toLocaleTimeString()}
                  </span>
                </button>
              );
            })
          )}
        </div>

        <div className={styles.detail}>
          {selected ? (
            <EventDetail entry={selected} />
          ) : (
            <div className={styles.detailEmpty}>
              Select an event to inspect its changes and payload.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Selected-event detail ────────────────────────────────────────────────────

function EventDetail({ entry }: { entry: EventLogEntry }) {
  const { event, patches, committed, timestamp, snapshotVersion } = entry;

  return (
    <div className={styles.detailInner}>
      <div className={styles.detailHead}>
        <span className={styles.detailTitle}>
          <span className={styles.channel}>{event.channel}</span>
          <span className={styles.detailDot}>.</span>
          <span className={styles.detailType}>{event.type}</span>
        </span>
        <span
          className={`${styles.badge} ${committed ? styles.badgeCommitted : styles.badgeBounced}`}
        >
          {committed ? "committed" : "vetoed"}
        </span>
      </div>
      <div className={styles.detailMeta}>
        <span>v{snapshotVersion}</span>
        <span>{new Date(timestamp).toLocaleTimeString()}</span>
      </div>

      {/* ── Changed leaf paths — the fine-grained story ─────────────────── */}
      <SectionLabel>
        Changed paths
        {committed && patches.length > 0 ? ` (${patches.length})` : ""}
      </SectionLabel>
      {!committed ? (
        <div className={styles.note}>Vetoed by middleware — no state change.</div>
      ) : patches.length === 0 ? (
        <div className={styles.note}>No state changes.</div>
      ) : (
        <div className={styles.changes}>
          {patches.map((p, i) => (
            <div key={i} className={styles.changeRow}>
              <span className={styles.changeOp} data-op={p.op}>
                {p.op}
              </span>
              <span className={styles.changePath}>{formatPointer(p.path)}</span>
              {p.op !== "remove" && (
                <span className={styles.changeValue}>{formatValue(p.value)}</span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── Triggering payload ──────────────────────────────────────────── */}
      <SectionLabel>Payload</SectionLabel>
      {event.payload != null ? (
        <div className={styles.payload}>
          <JsonTree data={event.payload} defaultExpanded />
        </div>
      ) : (
        <div className={styles.note}>No payload.</div>
      )}
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <div className={styles.sectionLabel}>{children}</div>;
}
