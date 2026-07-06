/**
 * @module @yoltra/devtools-storeview
 */

import type { EventLogEntry } from "@yoltra/devtools-ui";
import { JsonTree } from "../shared/JsonTree";
import styles from "./TimeTravelPanel.module.css";

/**
 * Time-travel view: a scrubber over the event history plus a live preview of
 * the store state reconstructed at the selected point.
 *
 * A range slider and step controls navigate the recorded events; the store is
 * snapped to the chosen point via `TIME_TRAVEL` while a "Resume Live" action
 * returns to the real-time stream. The reconstructed state at the current
 * position is rendered below so the effect of stepping through history is
 * visible without leaving the panel.
 *
 * @param props.entries - The full event log history.
 * @param props.currentIndex - Index of the currently viewed event.
 * @param props.isTimeTraveling - Whether time-travel mode is active.
 * @param props.previewState - Store state reconstructed at the current position.
 * @param props.onJumpTo - Jump to a specific event index.
 * @param props.onStepBack - Move one event backward.
 * @param props.onStepForward - Move one event forward.
 * @param props.onResume - Exit time-travel and resume live.
 * @public
 */
export function TimeTravelPanel({
  entries,
  currentIndex,
  isTimeTraveling,
  previewState,
  frameCount,
  onJumpTo,
  onStepBack,
  onStepForward,
  onResume,
}: {
  entries: EventLogEntry[];
  currentIndex: number;
  isTimeTraveling: boolean;
  previewState?: unknown;
  /**
   * Timeline length to measure against — frozen at travel-start so a live
   * store cannot shift the scrubber. Falls back to the live entry count.
   */
  frameCount?: number | null;
  onJumpTo: (index: number) => void;
  onStepBack: () => void;
  onStepForward: () => void;
  onResume: () => void;
}) {
  const hasEvents = entries.length > 0;
  // While traveling, the range is the frozen frame; live, it tracks the log.
  const total = frameCount ?? entries.length;
  const lastIndex = total - 1;
  const sliderValue = isTimeTraveling ? currentIndex : lastIndex;
  const currentEntry = entries[sliderValue];

  // Back is possible whenever there is an earlier event to view; Forward only
  // while traveling (there is nothing past the live stream).
  const canStepBack = hasEvents && sliderValue > 0;
  const canStepForward = isTimeTraveling;

  return (
    <div className={styles.container}>
      <div className={styles.controls}>
        <button className={styles.button} onClick={onStepBack} disabled={!canStepBack}>
          ‹ Back
        </button>
        <input
          type="range"
          className={styles.slider}
          min={0}
          max={Math.max(0, lastIndex)}
          value={sliderValue >= 0 ? sliderValue : 0}
          onChange={(e) => onJumpTo(Number(e.target.value))}
          disabled={!hasEvents}
        />
        <button className={styles.button} onClick={onStepForward} disabled={!canStepForward}>
          Forward ›
        </button>
        {isTimeTraveling && (
          <button className={styles.resumeButton} onClick={onResume}>
            Resume Live
          </button>
        )}
      </div>

      <div className={styles.info}>
        {!hasEvents ? (
          "No events recorded yet"
        ) : (
          <>
            Event {sliderValue + 1} / {total}
            {currentEntry && (
              <>
                {" — "}
                <span className={styles.infoEvent}>
                  {currentEntry.event.channel}.{currentEntry.event.type}
                </span>
              </>
            )}
            {isTimeTraveling && <span className={styles.infoTravel}> (time-traveling)</span>}
          </>
        )}
      </div>

      <div className={styles.preview}>
        {previewState != null ? (
          <JsonTree data={previewState} name="state" defaultExpanded />
        ) : (
          <div className={styles.previewEmpty}>
            {hasEvents
              ? "State preview appears once the baseline snapshot arrives."
              : "Emit some events, then scrub to replay the store’s history."}
          </div>
        )}
      </div>
    </div>
  );
}
