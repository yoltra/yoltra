/**
 * @module @yoltra/devtools-storeview
 */

import type { StoreMetrics, StoreSubscriptions } from "@yoltra/devtools-protocol";
import styles from "./MetricsDashboard.module.css";

type MetricsData = StoreMetrics["metrics"];

type SubscriptionData = Pick<
  StoreSubscriptions,
  "atomic" | "event" | "coarse" | "effects" | "middleware" | "reducers"
>;

// ─── Component ───────────────────────────────────────────────────────────────

/**
 * Dashboard of store performance metrics and architecture.
 *
 * ## Sections
 * - **Live** — throughput and timing counters sampled on every dispatch:
 *   events/sec, total events, average processing time, queue depth, dedup
 *   hits, and middleware rejections.
 * - **Architecture** — registered-consumer counts (reducers, effects,
 *   middleware, subscribers, connectors).
 * - **Consumers** — the actual registered reducers/effects/middleware and the
 *   live fine-grained (atomic) subscriptions, folded in from the former
 *   Subscriptions view.
 *
 * @param props.metrics - The metrics payload, or `null` when unavailable.
 * @param props.loading - Whether metrics are being fetched.
 * @param props.subscriptions - Subscription/consumer inventory, or `null`.
 * @public
 */
export function MetricsDashboard({
  metrics,
  loading,
  subscriptions,
}: {
  metrics: MetricsData | null;
  loading: boolean;
  subscriptions?: SubscriptionData | null;
}) {
  if (loading && !metrics) {
    return <div className={styles.loading}>Loading metrics…</div>;
  }

  if (!metrics) {
    return <div className={styles.empty}>No metrics available</div>;
  }

  return (
    <div className={styles.container}>
      {/* ── Live throughput ─────────────────────────────────────────────── */}
      <Section title="Live" note="Sampled on every dispatch">
        <Card accent="live" label="Events/sec" value={metrics.eventsPerSecond.toFixed(1)} />
        <Card accent="live" label="Total events" value={metrics.eventCount.toLocaleString()} />
        <Card
          accent="live"
          label="Avg processing"
          value={`${metrics.avgProcessingTimeMs.toFixed(2)} ms`}
        />
        <Card accent="live" label="Queue depth" value={String(metrics.queueDepth)} />
        <Card accent="live" label="Dedup hits" value={metrics.dedupHits.toLocaleString()} />
        <Card
          accent="live"
          label="MW rejections"
          value={metrics.middlewareRejections.toLocaleString()}
        />
      </Section>

      {/* ── Architecture counts ─────────────────────────────────────────── */}
      <Section title="Architecture" note="Registered consumers">
        <Card accent="arch" label="Reducers" value={String(metrics.reducerCount)} />
        <Card accent="arch" label="Effects" value={String(metrics.effectCount)} />
        <Card accent="arch" label="Middleware" value={String(metrics.middlewareCount)} />
        <Card accent="arch" label="Subscribers" value={String(metrics.subscriberCount)} />
        <Card accent="arch" label="Connectors" value={String(metrics.connectorCount)} />
      </Section>

      {/* ── Consumers detail (folds in the old Subscriptions view) ──────── */}
      {subscriptions && (
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionTitle}>Consumers</span>
            <span className={styles.sectionNote}>Pipeline &amp; live subscriptions</span>
          </div>
          <div className={styles.consumers}>
            <ConsumerGroup
              label="Reducers"
              items={subscriptions.reducers.map((r) => r.name)}
            />
            <ConsumerGroup
              label="Effects"
              items={subscriptions.effects.map(
                (e) => e.name ?? `${e.channel}::${e.type}`,
              )}
            />
            <ConsumerGroup
              label="Middleware"
              items={subscriptions.middleware.map((m) => m.name ?? "(anonymous)")}
            />
            <ConsumerGroup
              label="Atomic subscriptions"
              items={subscriptions.atomic.map((a) => `${a.reducer}.${a.property}`)}
            />
          </div>
        </div>
      )}
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

type CardAccent = "live" | "arch";

function Card({
  accent,
  label,
  value,
}: {
  accent: CardAccent;
  label: string;
  value: string;
}) {
  const accentClass = accent === "live" ? styles.cardLive : styles.cardArch;
  return (
    <div className={`${styles.card} ${accentClass}`}>
      <span className={styles.metricLabel}>{label}</span>
      <span className={styles.metricValue}>{value}</span>
    </div>
  );
}

// ─── Internal: ConsumerGroup ─────────────────────────────────────────────────

function ConsumerGroup({ label, items }: { label: string; items: string[] }) {
  return (
    <div className={styles.group}>
      <span className={styles.groupLabel}>
        {label}
        <span className={styles.groupCount}>{items.length}</span>
      </span>
      {items.length === 0 ? (
        <span className={styles.emptyChip}>none</span>
      ) : (
        <div className={styles.chips}>
          {items.map((item, i) => (
            <span key={`${item}-${i}`} className={styles.chip}>
              {item}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
