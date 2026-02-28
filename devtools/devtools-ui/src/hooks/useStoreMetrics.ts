/**
 * Hook that fetches and auto-refreshes performance metrics for a Yoltra store.
 *
 * @remarks
 * Sends periodic `REQUEST_METRICS` messages to the hub and caches the
 * latest `STORE_METRICS` response. The polling interval is configurable
 * and can be disabled by setting `refreshIntervalMs` to `0`.
 *
 * @module @yoltra/devtools-ui
 */

import {
  DevtoolsRole,
  type DevtoolsMessage,
  type StoreMetrics,
} from "@yoltra/devtools-protocol";
import { useCallback, useEffect, useRef, useState } from "react";
import { useHubConnection } from "./useHubConnection";

/**
 * Metrics payload extracted from a `STORE_METRICS` message.
 *
 * @internal
 */
type MetricsData = StoreMetrics["metrics"];

/**
 * Options for the {@link useStoreMetrics} hook.
 *
 * @public
 */
export interface UseStoreMetricsOptions {
  /** Auto-refresh interval in milliseconds. Set to `0` to disable. @defaultValue `2000` */
  refreshIntervalMs?: number;
}

/**
 * Fetches and caches performance metrics for a store, with automatic
 * periodic refresh.
 *
 * @remarks
 * On mount the hook immediately requests metrics and starts an interval
 * timer that re-fetches every `refreshIntervalMs` milliseconds (default
 * 2 000). The timer is cleaned up on unmount or when the `storeId` changes.
 *
 * @example
 * ```tsx
 * import { useStoreMetrics } from "@yoltra/devtools-ui";
 *
 * function MetricsPanel({ storeId }: { storeId: string }) {
 *   const { metrics, loading, refresh } = useStoreMetrics(storeId, {
 *     refreshIntervalMs: 5000,
 *   });
 *   if (loading || !metrics) return <p>Loading...</p>;
 *   return (
 *     <div>
 *       <pre>{JSON.stringify(metrics, null, 2)}</pre>
 *       <button onClick={refresh}>Refresh Now</button>
 *     </div>
 *   );
 * }
 * ```
 *
 * @param storeId - The store ID to query, or `null` to disable.
 * @param options - Optional configuration (see {@link UseStoreMetricsOptions}).
 * @returns An object with `metrics` ({@link MetricsData} or `null`),
 *   `loading`, and `refresh`.
 *
 * @public
 */
export function useStoreMetrics(
  storeId: string | null,
  options?: UseStoreMetricsOptions,
): {
  metrics: MetricsData | null;
  loading: boolean;
  refresh: () => void;
} {
  const { send, subscribe } = useHubConnection();
  const [metrics, setMetrics] = useState<MetricsData | null>(null);
  const [loading, setLoading] = useState(false);
  const intervalMs = options?.refreshIntervalMs ?? 2000;
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const requestMetrics = useCallback(() => {
    if (!storeId) return;
    setLoading(true);
    send({
      type: "REQUEST_METRICS",
      storeId,
      timestamp: new Date().toISOString(),
      sourceId: "",
      sourceRole: DevtoolsRole.EXTENSION,
    });
  }, [storeId, send]);

  useEffect(() => {
    if (!storeId) {
      setMetrics(null);
      return;
    }

    requestMetrics();

    const unsub = subscribe((msg: DevtoolsMessage) => {
      if (msg.type === "STORE_METRICS" && msg.storeId === storeId) {
        setMetrics(msg.metrics);
        setLoading(false);
      }
    });

    // Auto-refresh
    if (intervalMs > 0) {
      timerRef.current = setInterval(requestMetrics, intervalMs);
    }

    return () => {
      unsub();
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [storeId, subscribe, requestMetrics, intervalMs]);

  return { metrics, loading, refresh: requestMetrics };
}
