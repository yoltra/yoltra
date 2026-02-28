/**
 * @module @yoltra/devtools-storeview
 */

import { useCallback, useState } from "react";

const containerStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "var(--devtools-spacing-md)",
  padding: "var(--devtools-spacing-md)",
  height: "100%",
};

const fieldStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "var(--devtools-spacing-xs)",
};

const labelStyle: React.CSSProperties = {
  fontSize: "var(--devtools-font-size-sm)",
  color: "var(--devtools-fg-secondary)",
  textTransform: "uppercase",
  letterSpacing: "0.5px",
};

const inputStyle: React.CSSProperties = {
  padding: "var(--devtools-spacing-sm)",
  background: "var(--devtools-bg)",
  border: "1px solid var(--devtools-border)",
  borderRadius: "var(--devtools-radius)",
  color: "var(--devtools-fg)",
  fontFamily: "var(--devtools-font-mono)",
  fontSize: "var(--devtools-font-size-sm)",
  outline: "none",
};

const textareaStyle: React.CSSProperties = {
  ...inputStyle,
  minHeight: 120,
  resize: "vertical",
};

const btnStyle: React.CSSProperties = {
  padding: "var(--devtools-spacing-sm) var(--devtools-spacing-lg)",
  background: "var(--devtools-accent)",
  border: "none",
  borderRadius: "var(--devtools-radius)",
  color: "var(--devtools-accent-fg)",
  cursor: "pointer",
  fontSize: "var(--devtools-font-size)",
  fontFamily: "inherit",
  alignSelf: "flex-start",
};

const errorStyle: React.CSSProperties = {
  color: "var(--devtools-error)",
  fontSize: "var(--devtools-font-size-sm)",
};

/**
 * Form to emit events to a store.
 *
 * Provides channel, type, and JSON payload fields. Validates that
 * channel and type are non-empty and that the payload is valid JSON
 * before invoking the `onEmit` callback.
 *
 * @param props.onEmit - Callback invoked with the channel, type, and parsed payload.
 * @public
 */
export function EventEmitterPanel({
  onEmit,
}: {
  onEmit: (channel: string, type: string, payload: unknown) => void;
}) {
  const [channel, setChannel] = useState("");
  const [type, setType] = useState("");
  const [payloadJson, setPayloadJson] = useState("{}");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = useCallback(() => {
    if (!channel.trim() || !type.trim()) {
      setError("Channel and type are required");
      return;
    }

    try {
      const payload = JSON.parse(payloadJson);
      setError(null);
      onEmit(channel.trim(), type.trim(), payload);
    } catch {
      setError("Invalid JSON payload");
    }
  }, [channel, type, payloadJson, onEmit]);

  return (
    <div style={containerStyle}>
      <div style={fieldStyle}>
        <label style={labelStyle}>Channel</label>
        <input
          style={inputStyle}
          type='text'
          value={channel}
          onChange={(e) => setChannel(e.target.value)}
          placeholder='e.g., counter'
        />
      </div>
      <div style={fieldStyle}>
        <label style={labelStyle}>Type</label>
        <input
          style={inputStyle}
          type='text'
          value={type}
          onChange={(e) => setType(e.target.value)}
          placeholder='e.g., increment'
        />
      </div>
      <div style={fieldStyle}>
        <label style={labelStyle}>Payload (JSON)</label>
        <textarea
          style={textareaStyle}
          value={payloadJson}
          onChange={(e) => setPayloadJson(e.target.value)}
          placeholder='{ "amount": 1 }'
        />
      </div>
      {error && <div style={errorStyle}>{error}</div>}
      <button style={btnStyle} onClick={handleSubmit}>
        Emit Event
      </button>
    </div>
  );
}
