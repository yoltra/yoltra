/**
 * @module @yoltra/devtools-storeview
 */

import type { StoreSubscriptions } from "@yoltra/devtools-protocol";

type SubscriptionData = Omit<
  StoreSubscriptions,
  "type" | "timestamp" | "sourceId" | "sourceRole" | "storeId"
>;

const sectionStyle: React.CSSProperties = {
  padding: "var(--devtools-spacing-md)",
  borderBottom: "1px solid var(--devtools-border)",
};

const headingStyle: React.CSSProperties = {
  fontSize: "var(--devtools-font-size-sm)",
  color: "var(--devtools-fg-secondary)",
  marginBottom: "var(--devtools-spacing-sm)",
  textTransform: "uppercase",
  letterSpacing: "0.5px",
};

const itemStyle: React.CSSProperties = {
  fontFamily: "var(--devtools-font-mono)",
  fontSize: "var(--devtools-font-size-sm)",
  padding: "var(--devtools-spacing-xs) 0",
};

const labelStyle: React.CSSProperties = {
  color: "var(--devtools-info)",
};

const valueStyle: React.CSSProperties = {
  color: "var(--devtools-fg-secondary)",
};

function formatWhen(when: unknown): string {
  if (!when || typeof when !== "object") return String(when);
  const w = when as Record<string, unknown>;
  if (w.any === true) return "any";
  if (w.channel) return `channel: ${w.channel}`;
  if (w.channels) return `channels: ${(w.channels as string[]).join(", ")}`;
  if (w.keys) return `keys: ${JSON.stringify(w.keys)}`;
  return JSON.stringify(when);
}

/**
 * Displays subscription, effect, middleware, and reducer info for a store.
 *
 * Renders sectioned lists of atomic subscriptions, event subscriptions,
 * coarse subscribers, reducers, effects, and middleware registered in
 * the selected store.
 *
 * @param props.data - Subscription data for the store, or `null` when unavailable.
 * @param props.loading - Whether subscription data is being fetched.
 * @public
 */
export function SubscriptionsPanel({
  data,
  loading,
}: {
  data: SubscriptionData | null;
  loading: boolean;
}) {
  if (loading && !data) {
    return (
      <div style={{ padding: "var(--devtools-spacing-lg)", color: "var(--devtools-fg-muted)" }}>
        Loading...
      </div>
    );
  }

  if (!data) {
    return (
      <div style={{ padding: "var(--devtools-spacing-lg)", color: "var(--devtools-fg-muted)" }}>
        No data
      </div>
    );
  }

  return (
    <div style={{ overflow: "auto", height: "100%" }}>
      <div style={sectionStyle}>
        <div style={headingStyle}>Atomic Subscriptions ({data.atomic.length})</div>
        {data.atomic.map((sub, i) => (
          <div key={i} style={itemStyle}>
            <span style={labelStyle}>{sub.reducer}</span>
            <span style={valueStyle}>.{sub.property}</span>
          </div>
        ))}
        {data.atomic.length === 0 && <div style={valueStyle}>None</div>}
      </div>

      <div style={sectionStyle}>
        <div style={headingStyle}>Event Subscriptions ({data.event.length})</div>
        {data.event.map((sub, i) => (
          <div key={i} style={itemStyle}>
            <span style={labelStyle}>
              {sub.channel}::{sub.type}
            </span>
            <span style={valueStyle}> ({sub.phase})</span>
          </div>
        ))}
        {data.event.length === 0 && <div style={valueStyle}>None</div>}
      </div>

      <div style={sectionStyle}>
        <div style={headingStyle}>Coarse Subscribers</div>
        <div style={itemStyle}>{data.coarse}</div>
      </div>

      <div style={sectionStyle}>
        <div style={headingStyle}>Reducers ({data.reducers.length})</div>
        {data.reducers.map((r, i) => (
          <div key={i} style={itemStyle}>
            <span style={labelStyle}>{r.name}</span>
          </div>
        ))}
      </div>

      <div style={sectionStyle}>
        <div style={headingStyle}>Effects ({data.effects.length})</div>
        {data.effects.map((e, i) => (
          <div key={i} style={itemStyle}>
            <span style={labelStyle}>
              {e.channel}::{e.type}
            </span>
            {e.name && <span style={valueStyle}> — {e.name}</span>}
            {e.description && <span style={valueStyle}> ({e.description})</span>}
          </div>
        ))}
        {data.effects.length === 0 && <div style={valueStyle}>None</div>}
      </div>

      <div style={sectionStyle}>
        <div style={headingStyle}>Middleware ({data.middleware.length})</div>
        {data.middleware.map((m, i) => (
          <div key={i} style={itemStyle}>
            <span style={labelStyle}>{m.name ?? `middleware-${i}`}</span>
            {m.description && <span style={valueStyle}> — {m.description}</span>}
            {m.when ? (
              <span style={{ ...valueStyle, fontSize: "var(--devtools-font-size-sm)" }}>
                {" "}
                [when: {formatWhen(m.when)}]
              </span>
            ) : null}
          </div>
        ))}
        {data.middleware.length === 0 && <div style={valueStyle}>None</div>}
      </div>
    </div>
  );
}
