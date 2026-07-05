/**
 * Hook that maintains a live list of stores registered with the DevTools hub.
 *
 * @remarks
 * Subscribes to `STORE_REGISTRY`, `STORE_CONNECTED`, and
 * `STORE_DISCONNECTED` hub messages and keeps an up-to-date array of
 * {@link RegisteredStore} entries. Use this to build store selector UIs.
 *
 * @module @yoltra/devtools-ui
 */

import type { DevtoolsMessage } from "@yoltra/devtools-protocol";
import { useEffect, useState } from "react";
import type { RegisteredStore } from "../types";
import { useHubConnection } from "./useHubConnection";

/**
 * Tracks connected stores from `STORE_REGISTRY` hub broadcasts.
 *
 * @remarks
 * The hook listens for three message types:
 * - `STORE_REGISTRY` -- replaces the full store list (sent on initial connect).
 * - `STORE_CONNECTED` -- adds or updates a single store entry.
 * - `STORE_DISCONNECTED` -- marks a store as `"disconnected"`.
 *
 * The returned array is referentially stable unless the underlying data changes.
 *
 * @example
 * ```tsx
 * import { useStoreRegistry } from "@yoltra/devtools-ui";
 *
 * function StoreList() {
 *   const stores = useStoreRegistry();
 *   return (
 *     <ul>
 *       {stores.map((s) => (
 *         <li key={s.id}>{s.name} ({s.status})</li>
 *       ))}
 *     </ul>
 *   );
 * }
 * ```
 *
 * @returns The current list of registered stores (see {@link RegisteredStore}).
 *
 * @public
 */
export function useStoreRegistry(): RegisteredStore[] {
  const { subscribe } = useHubConnection();
  const [stores, setStores] = useState<RegisteredStore[]>([]);

  useEffect(() => {
    const unsub = subscribe((msg: DevtoolsMessage) => {
      switch (msg.type) {
        case "STORE_REGISTRY":
          setStores(msg.stores);
          break;
        case "STORE_CONNECTED":
          setStores((prev) => {
            const exists = prev.some((s) => s.id === msg.store.id);
            if (exists) {
              return prev.map((s) =>
                s.id === msg.store.id ? { ...s, status: "connected" as const } : s,
              );
            }
            return [
              ...prev,
              {
                id: msg.store.id,
                name: msg.store.name,
                status: "connected" as const,
                capabilities: msg.store.capabilities,
                connectedAt: msg.timestamp,
              },
            ];
          });
          break;
        case "STORE_DISCONNECTED":
          setStores((prev) =>
            prev.map((s) =>
              s.id === msg.storeId ? { ...s, status: "disconnected" as const } : s,
            ),
          );
          break;
      }
    });
    return unsub;
  }, [subscribe]);

  return stores;
}
