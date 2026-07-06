/**
 * Hook that provides a live, incrementally-patched view of a store's state.
 *
 * @remarks
 * On activation, the hook requests a full `STATE_SNAPSHOT` from the hub.
 * While waiting, any `STORE_EVENT` patches that arrive are buffered and
 * replayed once the snapshot lands. After that, each committed patch is
 * applied via {@link applyPatches} so the UI always reflects the latest
 * store state without requiring full snapshots.
 *
 * @module @yoltra/devtools-ui
 */

import { DevtoolsRole, type DevtoolsMessage, type JsonPatch } from "@yoltra/devtools-protocol";
import { useCallback, useEffect, useRef, useState } from "react";
import { applyPatches } from "../utils/apply-patch";
import { startSnapshotRetry } from "./snapshotRetry";
import { useHubConnection } from "./useHubConnection";

/**
 * How often to re-send `REQUEST_STATE` until the first `STATE_SNAPSHOT`
 * arrives. A single request can be lost if it races store registration or
 * the hub handshake, which would otherwise hang the panel forever; retrying
 * until the baseline lands makes the State view self-heal.
 *
 * @internal
 */
const SNAPSHOT_RETRY_INTERVAL_MS = 1500;

/**
 * Lazily fetches a store's full state and keeps it up-to-date via patches.
 *
 * @remarks
 * The state is initially `null` until a `STATE_SNAPSHOT` is received.
 * After that, incoming `STORE_EVENT` patches are applied incrementally
 * using {@link applyPatches}. Patches that arrive before the snapshot are
 * buffered and replayed in version order once the snapshot is available.
 *
 * Call `refresh()` to discard the current state and re-fetch from scratch.
 *
 * @example
 * ```tsx
 * import { useStoreState } from "@yoltra/devtools-ui";
 *
 * function StateInspector({ storeId }: { storeId: string }) {
 *   const { state, version, loading, refresh } = useStoreState(storeId);
 *   if (loading) return <p>Loading...</p>;
 *   return (
 *     <div>
 *       <p>Version: {version}</p>
 *       <pre>{JSON.stringify(state, null, 2)}</pre>
 *       <button onClick={refresh}>Refresh</button>
 *     </div>
 *   );
 * }
 * ```
 *
 * @param storeId - The store ID to track state for, or `null` to disable.
 * @returns An object with `state`, `version`, `loading`, and `refresh`.
 *
 * @public
 */
export function useStoreState(storeId: string | null): {
  state: unknown;
  version: number;
  loading: boolean;
  refresh: () => void;
} {
  const { send, subscribe } = useHubConnection();
  const [state, setState] = useState<unknown>(null);
  const [version, setVersion] = useState(0);
  const [loading, setLoading] = useState(false);
  const versionRef = useRef(0);
  const pendingPatchesRef = useRef<Array<{ patches: JsonPatch[]; version: number }>>([]);
  const cancelRetryRef = useRef<(() => void) | null>(null);

  const stopRetry = useCallback(() => {
    cancelRetryRef.current?.();
    cancelRetryRef.current = null;
  }, []);

  const requestState = useCallback(() => {
    if (!storeId) return;
    setLoading(true);
    send({
      type: "REQUEST_STATE",
      storeId,
      timestamp: new Date().toISOString(),
      sourceId: "",
      sourceRole: DevtoolsRole.EXTENSION,
    });
  }, [storeId, send]);

  useEffect(() => {
    if (!storeId) {
      setState(null);
      setVersion(0);
      versionRef.current = 0;
      return;
    }

    requestState();

    // Keep re-requesting until the first snapshot lands. A single REQUEST_STATE
    // can be dropped if it races store registration / the handshake, which used
    // to hang the State (and time-travel baseline) view indefinitely. The
    // snapshot handler below cancels this the moment a snapshot arrives.
    cancelRetryRef.current = startSnapshotRetry({
      request: requestState,
      isSettled: () => versionRef.current !== 0,
      intervalMs: SNAPSHOT_RETRY_INTERVAL_MS,
    });

    const unsub = subscribe((msg: DevtoolsMessage) => {
      if (msg.type === "STATE_SNAPSHOT" && msg.storeId === storeId) {
        stopRetry();
        setState(msg.state);
        setVersion(msg.version);
        versionRef.current = msg.version;
        setLoading(false);

        // Apply any buffered patches that arrived after the snapshot version
        const pending = pendingPatchesRef.current
          .filter((p) => p.version > msg.version)
          .sort((a, b) => a.version - b.version);
        pendingPatchesRef.current = [];

        if (pending.length > 0) {
          setState((prev: any) => {
            let current = prev;
            for (const p of pending) {
              current = applyPatches(current, p.patches);
            }
            return current;
          });
          const lastVersion = pending[pending.length - 1].version;
          setVersion(lastVersion);
          versionRef.current = lastVersion;
        }
        return;
      }

      if (msg.type === "STORE_EVENT" && msg.storeId === storeId && msg.committed) {
        if (versionRef.current === 0) {
          // No snapshot yet — buffer patches
          pendingPatchesRef.current.push({
            patches: msg.patches,
            version: msg.snapshotVersion,
          });
          return;
        }

        if (msg.snapshotVersion <= versionRef.current) {
          // Already applied
          return;
        }

        setState((prev: any) => applyPatches(prev, msg.patches));
        setVersion(msg.snapshotVersion);
        versionRef.current = msg.snapshotVersion;
      }
    });

    return () => {
      unsub();
      stopRetry();
      pendingPatchesRef.current = [];
    };
  }, [storeId, subscribe, requestState, stopRetry]);

  return { state, version, loading, refresh: requestState };
}
