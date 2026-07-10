/**
 * @module @yoltra/devtools-storeview
 */

import { useState } from "react";
import styles from "../../styles/panels/StateTree.module.css";
import { JsonTree } from "../shared/JsonTree";

/**
 * Lazy-loaded, searchable state tree explorer.
 *
 * Displays the current store state through a {@link JsonTree} with a
 * search bar that recursively filters keys and values. Shows a loading
 * indicator while state is being fetched.
 *
 * @param props.state - The current store state snapshot.
 * @param props.loading - Whether a state fetch is in progress.
 * @param props.onRefresh - Optional callback to manually refresh state.
 * @public
 */
export function StateTreeExplorer({
  state,
  loading,
  onRefresh,
}: {
  state: unknown;
  loading: boolean;
  onRefresh?: () => void;
}) {
  const [search, setSearch] = useState("");

  if (loading && state == null) {
    return <div className={styles.loading}>Loading state...</div>;
  }

  if (state == null) {
    return <div className={styles.loading}>No state available. Select a store.</div>;
  }

  const filteredState = search ? filterState(state, search) : state;

  return (
    <div className={styles.container}>
      <div className={styles.searchBar}>
        <input
          className={styles.searchInput}
          type='text'
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder='Search state...'
        />
        {onRefresh && (
          <button
            className={styles.refreshButton}
            onClick={onRefresh}
            title='Re-fetch the full state snapshot'
          >
            Refresh
          </button>
        )}
      </div>
      <JsonTree data={filteredState} name='state' defaultExpanded />
    </div>
  );
}

function filterState(state: unknown, query: string): unknown {
  if (state == null || typeof state !== "object") {
    return state;
  }

  const lowerQuery = query.toLowerCase();
  const result: Record<string, unknown> = {};
  let hasMatch = false;

  for (const [key, value] of Object.entries(state as Record<string, unknown>)) {
    if (key.toLowerCase().includes(lowerQuery)) {
      result[key] = value;
      hasMatch = true;
    } else if (typeof value === "object" && value != null) {
      const filtered = filterState(value, query);
      if (filtered != null && Object.keys(filtered as any).length > 0) {
        result[key] = filtered;
        hasMatch = true;
      }
    } else if (String(value).toLowerCase().includes(lowerQuery)) {
      result[key] = value;
      hasMatch = true;
    }
  }

  return hasMatch ? result : null;
}
