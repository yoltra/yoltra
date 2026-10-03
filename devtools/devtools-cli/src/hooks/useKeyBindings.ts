/**
 * @module @yoltra/devtools-cli
 */

import { useInput } from "ink";

/**
 * Key binding map for CLI navigation.
 *
 * Maps optional callback handlers for tab switching, store cycling,
 * quitting, and refreshing.
 *
 * @public
 */
export interface KeyBindings {
  onNextTab?: () => void;
  onPrevTab?: () => void;
  onNextStore?: () => void;
  onPrevStore?: () => void;
  onQuit?: () => void;
  /** Left arrow: step one event backward through recorded history. */
  onStepBack?: () => void;
  /** Right arrow: step one event forward. */
  onStepForward?: () => void;
  onRefresh?: () => void;
}

/**
 * Hook that maps keyboard input to navigation actions.
 *
 * Listens for Ink `useInput` events and dispatches to the provided
 * {@link KeyBindings} callbacks: Tab / Shift+Tab for panel switching,
 * `]` / `[` for store cycling, `q` for quit, and `r` for refresh.
 *
 * Pass `isActive: false` while a text field has the keyboard: these keys are ordinary
 * characters there, and typing a payload such as `["a"]` must not switch stores, nor a `q`
 * quit the program.
 *
 * @param bindings - The key binding handler map.
 * @param options - `isActive` (default `true`) turns the bindings off while it is `false`.
 * @public
 */
export function useKeyBindings(bindings: KeyBindings, options: { isActive?: boolean } = {}): void {
  useInput((input, key) => {
    if (key.tab && !key.shift) {
      bindings.onNextTab?.();
    } else if (key.tab && key.shift) {
      bindings.onPrevTab?.();
    } else if (input === "]") {
      bindings.onNextStore?.();
    } else if (input === "[") {
      bindings.onPrevStore?.();
    } else if (input === "q") {
      bindings.onQuit?.();
    } else if (input === "r") {
      bindings.onRefresh?.();
    } else if (key.leftArrow) {
      bindings.onStepBack?.();
    } else if (key.rightArrow) {
      bindings.onStepForward?.();
    }
  }, { isActive: options.isActive ?? true });
}
