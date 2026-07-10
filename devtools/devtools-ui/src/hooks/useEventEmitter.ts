/**
 * Hook that allows the DevTools extension to emit custom events to a
 * Yoltra store.
 *
 * @remarks
 * Wraps the `EMIT_TO_STORE` protocol message. The emitted event is
 * dispatched through the store's normal event pipeline (middleware,
 * reducers, subscribers) just as if it had been emitted from application
 * code. This is useful for manually triggering state transitions during
 * debugging.
 *
 * @module @yoltra/devtools-ui
 */

import { DevtoolsRole } from "@yoltra/devtools-protocol";
import { useCallback } from "react";
import { useHubConnection } from "./useHubConnection";

/**
 * Emits events to a store from the extension.
 *
 * @remarks
 * The returned `emit` function is referentially stable (memoised via
 * `useCallback`) and safe to include in dependency arrays. Calling `emit`
 * when `storeId` is `null` is a no-op.
 *
 * @example
 * ```tsx
 * import { useEventEmitter } from "@yoltra/devtools-ui";
 *
 * function EmitForm({ storeId }: { storeId: string }) {
 *   const { emit } = useEventEmitter(storeId);
 *
 *   const handleClick = () => {
 *     emit("counter", "INCREMENT", { amount: 1 });
 *   };
 *
 *   return <button onClick={handleClick}>Increment Counter</button>;
 * }
 * ```
 *
 * @param storeId - The store ID to emit events to, or `null` to disable.
 * @returns An object containing the `emit(channel, type, payload)` function.
 *
 * @public
 */
export function useEventEmitter(storeId: string | null): {
  emit: (channel: string, type: string, payload: unknown) => void;
} {
  const { send } = useHubConnection();

  const emit = useCallback(
    (channel: string, type: string, payload: unknown) => {
      if (!storeId) return;

      send({
        type: "EMIT_TO_STORE",
        storeId,
        event: { channel, type, payload },
        timestamp: new Date().toISOString(),
        sourceId: "",
        sourceRole: DevtoolsRole.EXTENSION,
      });
    },
    [storeId, send],
  );

  return { emit };
}
