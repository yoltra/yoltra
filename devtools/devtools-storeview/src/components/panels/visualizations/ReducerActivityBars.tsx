/**
 * @module @yoltra/devtools-storeview
 */

import { ResponsiveBar } from "@nivo/bar";
import type { StoreSubscriptions } from "@yoltra/devtools-protocol";
import type { EventLogEntry } from "@yoltra/devtools-ui";
import { useMemo, useState } from "react";
import { useNivoTheme } from "../../../hooks/useNivoTheme";
import styles from "./ReducerActivityBars.module.css";

// ─── Types ───────────────────────────────────────────────────────────────────

/**
 * Mirrors the shape returned by `useStoreSubscriptions().data`.
 *
 * @remarks
 * Defined locally to match the pattern established in `SubscriptionsPanel.tsx`,
 * which also omits the wire-message fields.
 */
type SubscriptionData = Omit<
  StoreSubscriptions,
  "type" | "timestamp" | "sourceId" | "sourceRole" | "storeId"
>;

/** Sort order for the bar list. */
type SortMode = "activity" | "name";

/** Rolling time windows available in the toolbar. */
type TimeWindow = "30s" | "60s" | "all";

/**
 * Aggregated activity stats for a single reducer slice.
 */
interface ReducerActivity {
  /** The reducer's slice name (e.g. `"counter"`, `"todos"`). */
  name: string;
  /**
   * Number of events that produced at least one patch on this slice.
   *
   * @remarks
   * Derived by scanning `EventLogEntry.patches` for entries whose JSON
   * Pointer path starts with `/${name}/`. A single event increments
   * `eventCount` by at most 1 per reducer even when it produces many patches.
   */
  eventCount: number;
  /**
   * Total individual patch operations that touched this slice.
   *
   * @remarks
   * Comparing `patchCount / eventCount` reveals whether a reducer performs
   * deep or shallow mutations per event.
   */
  patchCount: number;
  /** Unix epoch ms of the last event that touched this slice, or `0`. */
  lastActiveAt: number;
}

/**
 * Shape used by the Nivo bar chart.
 *
 * @remarks
 * The index signature `[key: string]: string | number` is required by
 * Nivo's `BarDatum` constraint.
 */
interface BarRow {
  [key: string]: string | number;
  reducer: string;
  events: number;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const WINDOW_MS: Record<TimeWindow, number | null> = {
  "30s": 30_000,
  "60s": 60_000,
  all: null,
};

/**
 * A reducer is considered "active" (accent colour) when its last event was
 * within this many ms. Beyond this threshold the bar turns muted.
 */
const IDLE_THRESHOLD_MS = 5_000;

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Extracts the reducer slice name from a JSON Pointer path.
 *
 * @remarks
 * Yoltra's devtools agent namespaces all patch paths under the reducer's
 * slice key: `/${reducerName}/rest/of/path`. This returns the first
 * non-empty path segment.
 *
 * @example
 * ```ts
 * reducerFromPath("/counter/value")  // → "counter"
 * reducerFromPath("/todos/items/0")  // → "todos"
 * reducerFromPath("")                // → null
 * ```
 *
 * @param path - A JSON Pointer string (RFC 6901).
 * @returns The reducer name, or `null` for malformed paths.
 */
function reducerFromPath(path: string): string | null {
  if (!path.startsWith("/")) return null;
  const segment = path.slice(1).split("/")[0];
  return segment && segment.length > 0 ? segment : null;
}

/**
 * Derives per-reducer activity from the event log in a single pass.
 *
 * @remarks
 * Reducers present in `registeredNames` but with no events in the window
 * are still included at zero so the list is stable and idle reducers visible.
 *
 * @param entries         - Full event log from `useEventLog`.
 * @param registeredNames - Known reducer names from `useStoreSubscriptions`.
 * @param windowMs        - Rolling window in ms, or `null` for "all time".
 */
function deriveActivity(
  entries: EventLogEntry[],
  registeredNames: string[],
  windowMs: number | null,
): Map<string, ReducerActivity> {
  const now = Date.now();

  // Seed map with all registered reducers at zero for a stable list.
  const map = new Map<string, ReducerActivity>(
    registeredNames.map((name) => [
      name,
      { name, eventCount: 0, patchCount: 0, lastActiveAt: 0 },
    ]),
  );

  for (const entry of entries) {
    if (windowMs !== null) {
      const age = now - new Date(entry.timestamp).getTime();
      if (age > windowMs) continue;
    }

    // Collect which reducer slices this event touched.
    const touchedReducers = new Set<string>();

    for (const patch of entry.patches) {
      const name = reducerFromPath(patch.path);
      if (!name) continue;

      if (!map.has(name)) {
        // Reducer appears in patches but not in subscriptions metadata.
        map.set(name, { name, eventCount: 0, patchCount: 0, lastActiveAt: 0 });
      }

      map.get(name)!.patchCount += 1;
      touchedReducers.add(name);
    }

    // One eventCount increment per reducer per event.
    const entryMs = new Date(entry.timestamp).getTime();
    for (const name of touchedReducers) {
      const a = map.get(name)!;
      a.eventCount += 1;
      a.lastActiveAt = Math.max(a.lastActiveAt, entryMs);
    }
  }

  return map;
}

// ─── Component ───────────────────────────────────────────────────────────────

/**
 * Displays per-reducer activity as a live horizontal bar chart using Nivo.
 *
 * ## How activity is measured
 * Every `EventLogEntry` includes a `patches` array of RFC 6902 JSON Patch
 * operations. Because Yoltra namespaces patch paths under the reducer slice
 * key (`/reducerName/...`), each patch can be attributed to its originating
 * reducer without extra protocol messages.
 *
 * ## Layout
 * A Nivo `<ResponsiveBar>` rendered in horizontal mode. Bar width is
 * proportional to `eventCount / maxEventCount`. Bars are coloured with
 * `--devtools-accent` when the reducer fired within `IDLE_THRESHOLD_MS`,
 * or muted grey otherwise. Clicking a bar expands an inline detail section.
 *
 * ## Zero-activity reducers
 * All reducers from `subscriptions.reducers` are always rendered (even at
 * zero), giving a stable list where idle reducers are visibly dark.
 *
 * @param props.entries       - Live event log from {@link useEventLog}.
 * @param props.subscriptions - Consumer metadata from {@link useStoreSubscriptions}.
 *
 * @public
 */
export function ReducerActivityBars({
  entries,
  subscriptions,
}: {
  entries: EventLogEntry[];
  subscriptions: SubscriptionData | null;
}) {
  const theme = useNivoTheme();
  const [activeWindow, setActiveWindow] = useState<TimeWindow>("all");
  const [sortMode, setSortMode] = useState<SortMode>("activity");
  const [expandedName, setExpandedName] = useState<string | null>(null);

  const registeredNames = useMemo(
    () => (subscriptions?.reducers ?? []).map((r) => r.name),
    [subscriptions],
  );

  const activityMap = useMemo(
    () => deriveActivity(entries, registeredNames, WINDOW_MS[activeWindow]),
    [entries, registeredNames, activeWindow],
  );

  const sortedReducers = useMemo(() => {
    const rows = [...activityMap.values()];
    return sortMode === "activity"
      ? rows.sort((a, b) => b.eventCount - a.eventCount || a.name.localeCompare(b.name))
      : rows.sort((a, b) => a.name.localeCompare(b.name));
  }, [activityMap, sortMode]);

  /*
   * Nivo horizontal bar renders top-to-bottom in the data order given.
   * Reversing ensures the highest-activity reducer appears at the top.
   * The data shape must satisfy BarDatum: { [key: string]: string | number }.
   */
  const nivoData = useMemo<BarRow[]>(
    () =>
      [...sortedReducers].reverse().map((r) => ({
        reducer: r.name,
        events: r.eventCount,
      })),
    [sortedReducers],
  );

  const expandedActivity =
    expandedName != null ? (activityMap.get(expandedName) ?? null) : null;

  const now = Date.now();

  return (
    <div className={styles.container}>
      {/* ── Toolbar ─────────────────────────────────────────────────────── */}
      <div className={styles.toolbar}>
        <span className={styles.toolbarLabel}>Window</span>
        {(["30s", "60s", "all"] as TimeWindow[]).map((w) => (
          <button
            key={w}
            className={`${styles.windowBtn} ${activeWindow === w ? styles.windowBtnActive : ""}`}
            onClick={() => setActiveWindow(w)}
          >
            {w}
          </button>
        ))}
        <span className={styles.toolbarSpacer} />
        <span className={styles.toolbarLabel}>Sort</span>
        <button
          className={`${styles.sortBtn} ${sortMode === "activity" ? styles.sortBtnActive : ""}`}
          onClick={() => setSortMode("activity")}
        >
          Activity
        </button>
        <button
          className={`${styles.sortBtn} ${sortMode === "name" ? styles.sortBtnActive : ""}`}
          onClick={() => setSortMode("name")}
        >
          Name
        </button>
      </div>

      {/* ── Bar chart ───────────────────────────────────────────────────── */}
      {sortedReducers.length === 0 ? (
        <div className={styles.empty}>No reducers registered</div>
      ) : (
        <div
          className={styles.chartContainer}
          // Dynamic height: 40px per bar row + 50px for bottom axis.
          style={{ height: Math.max(200, sortedReducers.length * 40 + 50) }}
        >
          <ResponsiveBar
            data={nivoData}
            keys={["events"]}
            indexBy="reducer"
            layout="horizontal"
            theme={theme}
            margin={{ top: 8, right: 80, bottom: 40, left: 110 }}
            padding={0.35}
            /*
             * Colour by idle/active status: look up the activityMap in the
             * closure rather than encoding booleans in the data (which would
             * violate the BarDatum string|number constraint).
             */
            colors={(bar) => {
              const a = activityMap.get(String(bar.indexValue));
              const isActive =
                a != null &&
                a.lastActiveAt > 0 &&
                now - a.lastActiveAt < IDLE_THRESHOLD_MS;
              return isActive ? "#007acc" : "#4a4a4a";
            }}
            borderRadius={2}
            borderWidth={0}
            enableGridX={true}
            enableGridY={false}
            enableLabel={true}
            labelSkipWidth={24}
            labelTextColor="#ffffff"
            axisLeft={{ tickSize: 0, tickPadding: 8 }}
            axisBottom={{
              tickSize: 0,
              tickPadding: 4,
              legend: "events",
              legendPosition: "middle",
              legendOffset: 32,
            }}
            tooltip={({ indexValue, value, color }) => {
              const a = activityMap.get(String(indexValue));
              const elapsedSec =
                a && a.lastActiveAt > 0
                  ? Math.floor((now - a.lastActiveAt) / 1000)
                  : null;
              return (
                <div
                  style={{
                    background: "#252526",
                    color: "#cccccc",
                    border: "1px solid #3c3c3c",
                    borderRadius: "3px",
                    fontSize: 11,
                    fontFamily: "monospace",
                    padding: "6px 10px",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <span
                    style={{
                      width: 10,
                      height: 10,
                      background: color,
                      borderRadius: 2,
                      flexShrink: 0,
                    }}
                  />
                  <strong>{indexValue}</strong>
                  <span>{value} events</span>
                  {elapsedSec !== null && (
                    <span style={{ color: "#6e6e6e" }}>
                      {elapsedSec === 0 ? "just now" : `${elapsedSec}s ago`}
                    </span>
                  )}
                </div>
              );
            }}
            onClick={(bar) => {
              const name = String(bar.indexValue);
              setExpandedName(expandedName === name ? null : name);
            }}
            animate
          />
        </div>
      )}

      {/* ── Expanded detail ─────────────────────────────────────────────── */}
      {expandedActivity && (
        <div className={styles.expandedDetail}>
          <div className={styles.detailHeader}>
            <span className={styles.detailName}>{expandedActivity.name}</span>
            <button
              className={styles.detailClose}
              onClick={() => setExpandedName(null)}
              title="Close"
            >
              ✕
            </button>
          </div>
          <div className={styles.detailGrid}>
            <DetailItem
              label="Events touched"
              value={String(expandedActivity.eventCount)}
            />
            <DetailItem label="Patch ops" value={String(expandedActivity.patchCount)} />
            <DetailItem
              label="Patches / event"
              value={
                expandedActivity.eventCount > 0
                  ? (expandedActivity.patchCount / expandedActivity.eventCount).toFixed(1)
                  : "—"
              }
            />
            <DetailItem
              label="Last active"
              value={
                expandedActivity.lastActiveAt > 0
                  ? new Date(expandedActivity.lastActiveAt).toLocaleTimeString()
                  : "—"
              }
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Internal: DetailItem ────────────────────────────────────────────────────

/**
 * A `label : value` pair inside the expanded reducer detail section.
 * @internal
 */
function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.detailItem}>
      <span className={styles.detailLabel}>{label}</span>
      <span className={styles.detailValue}>{value}</span>
    </div>
  );
}
