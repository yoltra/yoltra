/**
 * @module @yoltra/devtools-storeview
 */

import type { RegisteredStore } from "@yoltra/devtools-ui";
import cx from "classnames";
import { ConnectionDot } from "../shared/ConnectionDot";
import styles from "./TopBar.module.css";
import yoltraLogo from "../../assets/logo.svg";

/**
 * Top bar with the Yoltra brand and a store selector.
 *
 * Shows the DevTools wordmark on the left and each registered store as a
 * selectable pill on the right, alongside a {@link ConnectionDot} reflecting
 * its live connection status.
 *
 * @param props.stores - Array of registered stores to display.
 * @param props.selectedStoreId - The currently selected store ID, or `null`.
 * @param props.onSelectStore - Callback invoked when a store is chosen.
 * @public
 */
export function TopBar({
  stores,
  selectedStoreId,
  onSelectStore,
}: {
  stores: RegisteredStore[];
  selectedStoreId: string | null;
  onSelectStore: (id: string) => void;
}) {
  return (
    <header className={styles.topBar}>
      <div className={styles.brand}>
        <img className={styles.logo} src={yoltraLogo} alt="Yoltra" />
        <span className={styles.wordmark}>DevTools</span>
      </div>
      <div className={styles.stores}>
        {stores.map((store) => (
          <button
            key={store.id}
            className={cx(styles.storeTab, {
              [styles.storeTabActive]: selectedStoreId === store.id,
            })}
            onClick={() => onSelectStore(store.id)}
            title={store.name}
          >
            <ConnectionDot status={store.status} />
            <span className={styles.storeName}>{store.name}</span>
          </button>
        ))}
        {stores.length === 0 && (
          <span className={styles.noStores}>No stores connected</span>
        )}
      </div>
    </header>
  );
}
