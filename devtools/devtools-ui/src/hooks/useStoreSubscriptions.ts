/**
 * Hook that fetches and caches subscription and consumer information for
 * a Yoltra store.
 *
 * @remarks
 * Sends a `REQUEST_SUBSCRIPTIONS` message to the hub and resolves when
 * the corresponding `STORE_SUBSCRIPTIONS` response arrives. The result
 * includes atomic, event, coarse, effect, middleware, and reducer
 * subscription breakdowns. Call `refresh()` to re-fetch.
 *
 * @module @yoltra/devtools-ui
 */

import {
  DevtoolsRole,
  type DevtoolsMessage,
  type StoreSubscriptions,
} from "@yoltra/devtools-protocol";
import { useCallback, useEffect, useState } from "react";
import { useHubConnection } from "./useHubConnection";

/**
 * Subscription data payload with protocol envelope fields stripped.
 *
 * @internal
 */
type SubscriptionData = Omit<
  StoreSubscriptions,
  "type" | "timestamp" | "sourceId" | "sourceRole" | "storeId"
>;

/**
 * Fetches and caches subscription/consumer info for a store.
 *
 * @remarks
 * On mount (or when `storeId` changes) the hook sends a
 * `REQUEST_SUBSCRIPTIONS` message and sets `loading` to `true`. When the
 * matching `STORE_SUBSCRIPTIONS` response arrives the data is cached and
 * `loading` flips to `false`.
 *
 * @example
 * ```tsx
 * import { useStoreSubscriptions } from "@yoltra/devtools-ui";
 *
 * function SubscriptionPanel({ storeId }: { storeId: string }) {
 *   const { data, loading, refresh } = useStoreSubscriptions(storeId);
 *   if (loading || !data) return <p>Loading...</p>;
 *   return (
 *     <div>
 *       <p>Atomic: {data.atomic.length}</p>
 *       <p>Event: {data.event.length}</p>
 *       <button onClick={refresh}>Refresh</button>
 *     </div>
 *   );
 * }
 * ```
 *
 * @param storeId - The store ID to query, or `null` to disable.
 * @returns An object with `data` ({@link SubscriptionData} or `null`),
 *   `loading`, and `refresh`.
 *
 * @public
 */
export function useStoreSubscriptions(storeId: string | null): {
  data: SubscriptionData | null;
  loading: boolean;
  refresh: () => void;
} {
  const { send, subscribe } = useHubConnection();
  const [data, setData] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(false);

  const requestSubscriptions = useCallback(() => {
    if (!storeId) return;
    setLoading(true);
    send({
      type: "REQUEST_SUBSCRIPTIONS",
      storeId,
      timestamp: new Date().toISOString(),
      sourceId: "",
      sourceRole: DevtoolsRole.EXTENSION,
    });
  }, [storeId, send]);

  useEffect(() => {
    if (!storeId) {
      setData(null);
      return;
    }

    requestSubscriptions();

    const unsub = subscribe((msg: DevtoolsMessage) => {
      if (msg.type === "STORE_SUBSCRIPTIONS" && msg.storeId === storeId) {
        setData({
          atomic: msg.atomic,
          event: msg.event,
          coarse: msg.coarse,
          effects: msg.effects,
          middleware: msg.middleware,
          reducers: msg.reducers,
        });
        setLoading(false);
      }
    });

    return unsub;
  }, [storeId, subscribe, requestSubscriptions]);

  return { data, loading, refresh: requestSubscriptions };
}
