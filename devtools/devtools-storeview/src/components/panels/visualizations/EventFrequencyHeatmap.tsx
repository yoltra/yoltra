/**
 * @module @yoltra/devtools-storeview
 */

import { ResponsiveHeatMap } from "@nivo/heatmap";
import type { EventLogEntry } from "@yoltra/devtools-ui";
import { useEffect, useMemo, useState } from "react";
import { useNivoTheme } from "../../../hooks/useNivoTheme";
import styles from "./EventFrequencyHeatmap.module.css";

// ─── Types ───────────────────────────────────────────────────────────────────

/**
 * The four supported rolling time windows for frequency counting.
 *
 * - `"1s"`  — last 1 second.
 * - `"10s"` — last 10 seconds.
 * - `"60s"` — last 60 seconds.
 * - `"all"` — entire in-memory event log (no time filter).
 */
type TimeWindow = "1s" | "10s" | "60s" | "all";

/**
 * Aggregated statistics for a single `channel::type` pair.
 * Used as the value type in the {@link deriveHeatmapData} result.
 */
interface HeatCell {
  channel: string;
  type: string;
  /** Total times this pair was seen in the active window. */
  count: number;
  /** Events that did NOT pass middleware (`committed === false`). */
  rejectedCount: number;
  /** Unix epoch ms of the most recent occurrence. */
  lastFiredAt: number;
}

// ─── Constants ───────────────────────────────────────────────────────────────

/** Maps each time-window label to its duration in ms, or `null` for "all". */
const WINDOW_MS: Record<TimeWindow, number | null> = {
  "1s": 1_000,
  "10s": 10_000,
  "60s": 60_000,
  all: null,
};

/** Minimum background opacity for any cell with ≥ 1 event. */
const MIN_INTENSITY = 0.08;

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Derives heatmap data from the raw event log in a single O(n) pass.
 *
 * @remarks
 * Iterates all entries, filtering by the active time window, and produces:
 * - `cells`    — a `Map<"channel::type", HeatCell>` of aggregated stats.
 * - `channels` — alphabetically sorted list of unique channel names.
 * - `types`    — map of `channel → sorted type[]` for grid column generation.
 *
 * @param entries  - The full event log from `useEventLog`.
 * @param windowMs - Time-window in ms, or `null` for "all time".
 */
function deriveHeatmapData(
  entries: EventLogEntry[],
  windowMs: number | null,
): {
  cells: Map<string, HeatCell>;
  channels: string[];
  types: Map<string, string[]>;
} {
  const now = Date.now();
  const cells = new Map<string, HeatCell>();
  const channelSet = new Set<string>();
  const typesByChannel = new Map<string, Set<string>>();

  for (const entry of entries) {
    if (windowMs !== null) {
      const age = now - new Date(entry.timestamp).getTime();
      if (age > windowMs) continue;
    }

    const { channel, type } = entry.event;
    const key = `${channel}::${type}`;

    channelSet.add(channel);

    if (!typesByChannel.has(channel)) typesByChannel.set(channel, new Set());
    typesByChannel.get(channel)!.add(type);

    const prev = cells.get(key);
    cells.set(key, {
      channel,
      type,
      count: (prev?.count ?? 0) + 1,
      rejectedCount: (prev?.rejectedCount ?? 0) + (entry.committed ? 0 : 1),
      lastFiredAt: Math.max(
        prev?.lastFiredAt ?? 0,
        new Date(entry.timestamp).getTime(),
      ),
    });
  }

  const channels = [...channelSet].sort();
  const types = new Map<string, string[]>();
  for (const [ch, typeSet] of typesByChannel) {
    types.set(ch, [...typeSet].sort());
  }

  return { cells, channels, types };
}

/**
 * Maps a count to a CSS opacity value in [MIN_INTENSITY, 1.0] relative to
 * the maximum count across all visible cells.
 *
 * @param count - Count for this cell (must be ≥ 1).
 * @param max   - Maximum count across all cells.
 */
function heatIntensity(count: number, max: number): number {
  if (max === 0 || count === 0) return 0;
  return MIN_INTENSITY + (count / max) * (1 - MIN_INTENSITY);
}

// ─── Component ───────────────────────────────────────────────────────────────

/**
 * Visualises the event log as a two-dimensional frequency heatmap using Nivo.
 *
 * ## Layout
 * - **Rows**    — unique `channel` values, sorted alphabetically.
 * - **Columns** — unique `event.type` values within each channel.
 * - **Intensity** — cell opacity is proportional to event frequency, normalised
 *   against the busiest cell so relative hotspots remain visible.
 * - **Hue** — cells shift from `--devtools-accent` (blue, fully committed)
 *   toward `--devtools-bounced` (red) once the rejection rate exceeds 50%.
 *
 * ## Interactivity
 * - **Time window buttons** — 1s / 10s / 60s / All — re-filter the log live.
 * - **Cell click** — selects a cell and reveals a stats panel below the chart.
 * - **Hover tooltip** — Nivo's floating tooltip shows count + rejection info.
 *
 * @param props.entries - Live event log from {@link useEventLog}.
 *
 * @public
 */
export function EventFrequencyHeatmap({ entries }: { entries: EventLogEntry[] }) {
  const theme = useNivoTheme();
  const [activeWindow, setActiveWindow] = useState<TimeWindow>("all");
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  const { cells, channels, types } = useMemo(
    () => deriveHeatmapData(entries, WINDOW_MS[activeWindow]),
    [entries, activeWindow],
  );

  const maxCount = useMemo(() => {
    let max = 0;
    for (const cell of cells.values()) max = Math.max(max, cell.count);
    return max;
  }, [cells]);

  // Drop the selection if the selected pair leaves the active window.
  useEffect(() => {
    if (selectedKey && !cells.has(selectedKey)) setSelectedKey(null);
  }, [cells, selectedKey]);

  // Transform to Nivo HeatMap format: [{ id: channel, data: [{ x: type, y: count }] }]
  const nivoData = useMemo(
    () =>
      channels.map((channel) => ({
        id: channel,
        data: (types.get(channel) ?? []).map((type) => ({
          x: type,
          y: cells.get(`${channel}::${type}`)?.count ?? 0,
        })),
      })),
    [channels, types, cells],
  );

  const selectedCell = selectedKey != null ? (cells.get(selectedKey) ?? null) : null;

  return (
    <div className={styles.container}>
      {/* ── Toolbar ─────────────────────────────────────────────────────── */}
      <div className={styles.toolbar}>
        <span className={styles.toolbarLabel}>Window</span>
        {(["1s", "10s", "60s", "all"] as TimeWindow[]).map((w) => (
          <button
            key={w}
            className={`${styles.windowBtn} ${activeWindow === w ? styles.windowBtnActive : ""}`}
            onClick={() => setActiveWindow(w)}
          >
            {w}
          </button>
        ))}
        <span className={styles.toolbarSpacer} />
        <span className={styles.toolbarMeta}>
          {cells.size} pair{cells.size !== 1 ? "s" : ""} · {entries.length} events
        </span>
      </div>

      {/* ── Heatmap chart ────────────────────────────────────────────────── */}
      {channels.length === 0 ? (
        <div className={styles.empty}>No events in this window</div>
      ) : (
        <div
          className={styles.chartContainer}
          // Dynamic height: 40px per channel row + 120px for margins/axes.
          // Mirrors the ReducerActivityBars pattern to ensure Nivo's
          // ResizeObserver always measures a concrete pixel height.
          style={{ height: Math.max(200, channels.length * 40 + 120) }}
        >
          <ResponsiveHeatMap
            data={nivoData}
            theme={theme}
            margin={{ top: 40, right: 20, bottom: 80, left: 100 }}
            valueFormat=">-.0f"
            /*
             * Colors function: look up the HeatCell for the actual rejection
             * rate. Cells with >50% rejection shift from blue to red.
             * Opacity encodes relative event frequency (normalised to the
             * busiest cell so low-traffic pairs remain visible).
             */
            colors={(cell) => {
              const key = `${cell.serieId}::${cell.data.x}`;
              const heatCell = cells.get(key);
              const rejectionRate =
                heatCell && heatCell.count > 0
                  ? (heatCell.rejectedCount / heatCell.count) * 100
                  : 0;
              const opacity = heatIntensity(cell.value ?? 0, maxCount);
              return rejectionRate > 50
                ? `rgba(244, 71, 71, ${opacity})`
                : `rgba(0, 122, 204, ${opacity})`;
            }}
            emptyColor="#2d2d30"
            borderColor="#3c3c3c"
            borderRadius={2}
            enableLabels={false}
            axisTop={null}
            axisLeft={{ tickSize: 0, tickPadding: 8 }}
            axisBottom={{ tickSize: 0, tickRotation: -35, tickPadding: 8 }}
            onClick={(cell) => {
              const key = `${cell.serieId}::${cell.data.x}`;
              setSelectedKey(selectedKey === key ? null : key);
            }}
            /*
             * Custom tooltip: styled to match the devtools theme and shows
             * the rejection rate alongside the event count.
             */
            tooltip={({ cell }) => {
              const key = `${cell.serieId}::${cell.data.x}`;
              const heatCell = cells.get(key);
              const rejectionRate =
                heatCell && heatCell.count > 0
                  ? ((heatCell.rejectedCount / heatCell.count) * 100).toFixed(0)
                  : "0";
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
                    lineHeight: 1.5,
                  }}
                >
                  <strong>
                    {cell.serieId}::{String(cell.data.x)}
                  </strong>
                  <div>{cell.formattedValue} events</div>
                  {Number(rejectionRate) > 0 && (
                    <div style={{ color: "#f44747" }}>{rejectionRate}% rejected</div>
                  )}
                </div>
              );
            }}
            animate
          />
        </div>
      )}

      {/* ── Selected cell detail ─────────────────────────────────────────── */}
      {selectedCell && (
        <div className={styles.detail}>
          <div className={styles.detailHeader}>
            <code className={styles.detailKey}>
              {selectedCell.channel}::{selectedCell.type}
            </code>
            <button
              className={styles.detailClose}
              onClick={() => setSelectedKey(null)}
              title="Close"
            >
              ✕
            </button>
          </div>
          <div className={styles.detailStats}>
            <StatItem label="Total fired" value={String(selectedCell.count)} />
            <StatItem
              label="Committed"
              value={String(selectedCell.count - selectedCell.rejectedCount)}
            />
            <StatItem label="Rejected" value={String(selectedCell.rejectedCount)} />
            <StatItem
              label="Rejection rate"
              value={
                selectedCell.count > 0
                  ? `${((selectedCell.rejectedCount / selectedCell.count) * 100).toFixed(1)}%`
                  : "—"
              }
            />
            <StatItem
              label="Last fired"
              value={
                selectedCell.lastFiredAt > 0
                  ? new Date(selectedCell.lastFiredAt).toLocaleTimeString()
                  : "—"
              }
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Internal: StatItem ──────────────────────────────────────────────────────

/**
 * A `label : value` row inside the selected-cell detail panel.
 * @internal
 */
function StatItem({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.stat}>
      <span className={styles.statLabel}>{label}</span>
      <span className={styles.statValue}>{value}</span>
    </div>
  );
}
