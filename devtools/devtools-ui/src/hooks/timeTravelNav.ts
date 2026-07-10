/**
 * Pure navigation math for time-travel stepping.
 *
 * @remarks
 * Kept separate from {@link useTimeTravel} so the boundary conditions — the
 * part that is easy to get wrong — are unit-testable without React. The hook
 * translates the returned action into `jumpTo` / `resume` calls.
 *
 * @module @yoltra/devtools-ui
 */

/**
 * The action a step resolves to.
 *
 * @internal
 */
export type StepAction =
  | { kind: "jump"; index: number }
  | { kind: "resume" }
  | { kind: "none" };

/**
 * Current navigation state.
 *
 * @internal
 */
export interface StepState {
  /** Whether a time-travel session is active. */
  isTimeTraveling: boolean;
  /** The viewed entry index while traveling (ignored when not). */
  currentIndex: number;
  /** Total number of recorded events. */
  entryCount: number;
}

/**
 * Resolve one `back` / `forward` step to a concrete action.
 *
 * - **back** — from live, start at the newest event; while traveling, move
 *   relative to the current position. Steps to the previous event, or does
 *   nothing at the very start.
 * - **forward** — only meaningful while traveling (nothing lies past live).
 *   Advances one event, or resumes the live stream once the newest event is
 *   reached so the store is resynced rather than left on a stale snapshot.
 *
 * @param direction - `"back"` or `"forward"`.
 * @param state - See {@link StepState}.
 * @returns The {@link StepAction} to apply.
 * @internal
 */
export function planStep(direction: "back" | "forward", state: StepState): StepAction {
  const { isTimeTraveling, currentIndex, entryCount } = state;
  const lastIndex = entryCount - 1;

  if (direction === "back") {
    const viewIndex = isTimeTraveling ? currentIndex : lastIndex;
    const target = viewIndex - 1;
    return target >= 0 ? { kind: "jump", index: target } : { kind: "none" };
  }

  // forward
  if (!isTimeTraveling) return { kind: "none" };
  const target = currentIndex + 1;
  // Step onto the newest event; only stepping *past* it returns to live so the
  // store is resynced rather than left on a stale reconstructed snapshot.
  return target > lastIndex ? { kind: "resume" } : { kind: "jump", index: target };
}
