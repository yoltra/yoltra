/**
 * @module @yoltra/devtools-storeview
 */

import type { EventLogEntry } from "@yoltra/devtools-ui";

const containerStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  height: "100%",
  padding: "var(--devtools-spacing-md)",
  gap: "var(--devtools-spacing-md)",
};

const controlsStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "var(--devtools-spacing-md)",
};

const btnStyle: React.CSSProperties = {
  padding: "var(--devtools-spacing-sm) var(--devtools-spacing-md)",
  background: "var(--devtools-bg-tertiary)",
  border: "1px solid var(--devtools-border)",
  borderRadius: "var(--devtools-radius)",
  color: "var(--devtools-fg)",
  cursor: "pointer",
  fontSize: "var(--devtools-font-size-sm)",
  fontFamily: "inherit",
};

const sliderStyle: React.CSSProperties = {
  flex: 1,
  accentColor: "var(--devtools-accent)",
};

const infoStyle: React.CSSProperties = {
  fontFamily: "var(--devtools-font-mono)",
  fontSize: "var(--devtools-font-size-sm)",
  color: "var(--devtools-fg-secondary)",
};

/**
 * Time travel slider/stepper through event history.
 *
 * Provides a range slider and step-back / step-forward buttons to
 * navigate through recorded events. A "Resume Live" button appears
 * while time-traveling to return to the real-time event stream.
 *
 * @param props.entries - The full event log history.
 * @param props.currentIndex - The index of the currently viewed event.
 * @param props.isTimeTraveling - Whether time-travel mode is active.
 * @param props.onJumpTo - Callback to jump to a specific event index.
 * @param props.onStepBack - Callback to move one event backward.
 * @param props.onStepForward - Callback to move one event forward.
 * @param props.onResume - Callback to exit time-travel and resume live.
 * @public
 */
export function TimeTravelPanel({
  entries,
  currentIndex,
  isTimeTraveling,
  onJumpTo,
  onStepBack,
  onStepForward,
  onResume,
}: {
  entries: EventLogEntry[];
  currentIndex: number;
  isTimeTraveling: boolean;
  onJumpTo: (index: number) => void;
  onStepBack: () => void;
  onStepForward: () => void;
  onResume: () => void;
}) {
  const sliderValue = isTimeTraveling ? currentIndex : entries.length - 1;
  const currentEntry = entries[sliderValue];

  return (
    <div style={containerStyle}>
      <div style={controlsStyle}>
        <button style={btnStyle} onClick={onStepBack} disabled={entries.length === 0}>
          Step Back
        </button>
        <input
          type='range'
          style={sliderStyle}
          min={0}
          max={Math.max(0, entries.length - 1)}
          value={sliderValue >= 0 ? sliderValue : 0}
          onChange={(e) => onJumpTo(Number(e.target.value))}
          disabled={entries.length === 0}
        />
        <button style={btnStyle} onClick={onStepForward} disabled={entries.length === 0}>
          Step Forward
        </button>
        {isTimeTraveling && (
          <button
            style={{
              ...btnStyle,
              background: "var(--devtools-accent)",
              color: "var(--devtools-accent-fg)",
            }}
            onClick={onResume}
          >
            Resume Live
          </button>
        )}
      </div>
      <div style={infoStyle}>
        {entries.length === 0 ? (
          "No events recorded"
        ) : (
          <>
            Event {sliderValue + 1} / {entries.length}
            {currentEntry && (
              <>
                {" "}
                — {currentEntry.event.channel}::{currentEntry.event.type}
              </>
            )}
            {isTimeTraveling && " (time-traveling)"}
          </>
        )}
      </div>
    </div>
  );
}
