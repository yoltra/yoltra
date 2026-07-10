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
  onRefresh?: () => void;
}

/**
 * Hook that maps keyboard input to navigation actions.
 *
 * Listens for Ink `useInput` events and dispatches to the provided
 * {@link KeyBindings} callbacks: Tab / Shift+Tab for panel switching,
 * `]` / `[` for store cycling, `q` for quit, and `r` for refresh.
 *
 * @param bindings - The key binding handler map.
 * @public
 */
export function useKeyBindings(bindings: KeyBindings): void {
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
    }
  });
}
