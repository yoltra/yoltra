/**
 * @module @yoltra/devtools-storeview
 */

import type { StoreMetrics } from "@yoltra/devtools-protocol";
import styles from "./MetricsDashboard.module.css";

type MetricsData = StoreMetrics["metrics"];

// ─── Component ───────────────────────────────────────────────────────────────

/**
 * Sectioned dashboard of store performance metrics.
 *
 * ## Sections
 * - **Live** — event throughput counters that update on every dispatch.
 *   Tracked by the `__devtools_metrics_counter` middleware and the
 *   interceptor effect registered in `withDevtools`.
 * - **Architecture** — static counts of registered store consumers.
 *   Read from `__devtoolsIntrospect()` on every `REQUEST_METRICS` call.
 * - **Unavailable** — metrics that require internal core instrumentation
 *   not exposed via the public store API. Displayed as "—" with a note.
 *
 * @param props.metrics - The metrics data object, or `null` when unavailable.
 * @param props.loading - Whether metrics are being fetched.
 * @public
 */
export function MetricsDashboard({
  metrics,
  loading,
}: {
  metrics: MetricsData | null;
  loading: boolean;
}) {
  if (loading && !metrics) {
    return <div className={styles.loading}>Loading metrics…</div>;
  }

  if (!metrics) {
    return <div className={styles.empty}>No metrics available</div>;
  }

  return (
    <div className={styles.container}>
      {/* ── Section 1: Live throughput ─────────────────────────────────── */}
      <Section title="Live" note="Updates on every dispatch">
        <Card
          accent="live"
          label="Events/sec"
          value={metrics.eventsPerSecond.toFixed(1)}
        />
        <Card
          accent="live"
          label="Total events"
          value={metrics.eventCount.toLocaleString()}
        />
        <Card
          accent="live"
          label="MW rejections"
          value={metrics.middlewareRejections.toLocaleString()}
        />
      </Section>

      {/* ── Section 2: Architecture ────────────────────────────────────── */}
      <Section title="Architecture" note="Registered consumers">
        <Card
          accent="arch"
          label="Reducers"
          value={String(metrics.reducerCount)}
        />
        <Card
          accent="arch"
          label="Effects"
          value={String(metrics.effectCount)}
        />
        <Card
          accent="arch"
          label="Middleware"
          value={String(metrics.middlewareCount)}
        />
        <Card
          accent="arch"
          label="Subscribers"
          value={String(metrics.subscriberCount)}
        />
        <Card
          accent="arch"
          label="Connectors"
          value={String(metrics.connectorCount)}
        />
      </Section>

      {/* ── Section 3: Unavailable ─────────────────────────────────────── */}
      <Section title="Unavailable" note="Requires core instrumentation">
        <Card
          accent="unavailable"
          label="Avg processing"
          value="—"
          note="Not exposed via store API"
        />
        <Card
          accent="unavailable"
          label="Queue depth"
          value="—"
          note="Not exposed via store API"
        />
        <Card
          accent="unavailable"
          label="Dedup hits"
          value="—"
          note="Not exposed via store API"
        />
      </Section>
    </div>
  );
}

// ─── Internal: Section ───────────────────────────────────────────────────────

function Section({
  title,
  note,
  children,
}: {
  title: string;
  note?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={styles.section}>
      <div className={styles.sectionHeader}>
        <span className={styles.sectionTitle}>{title}</span>
        {note && <span className={styles.sectionNote}>{note}</span>}
      </div>
      <div className={styles.cardGrid}>{children}</div>
    </div>
  );
}

// ─── Internal: Card ──────────────────────────────────────────────────────────

type CardAccent = "live" | "arch" | "unavailable";

function Card({
  accent,
  label,
  value,
  note,
}: {
  accent: CardAccent;
  label: string;
  value: string;
  note?: string;
}) {
  const accentClass =
    accent === "live"
      ? styles.cardLive
      : accent === "arch"
        ? styles.cardArch
        : styles.cardUnavailable;

  return (
    <div className={`${styles.card} ${accentClass}`}>
      <span className={styles.metricLabel}>{label}</span>
      <span className={styles.metricValue}>{value}</span>
      {note && <span className={styles.metricNote}>{note}</span>}
    </div>
  );
}
