/**
 * @module @yoltra/devtools-storeview
 */

import {
  HubProvider,
  useEventEmitter,
  useEventLog,
  useHubConnection,
  useStoreMetrics,
  useStoreRegistry,
  useStoreState,
  useStoreSubscriptions,
  useTimeTravel,
  type HubConnectionConfig,
} from "@yoltra/devtools-ui";
import { ThemeProvider } from "./theme";
import type { StoreCapabilities } from "@yoltra/devtools-protocol";
import cx from "classnames";
import { useEffect, useState } from "react";

import { BottomBar } from "./components/layout/BottomBar";
import { TopBar } from "./components/layout/TopBar";
import { Inspector } from "./components/panels/Inspector";
import { MetricsDashboard } from "./components/panels/MetricsDashboard";
import { StateTreeExplorer } from "./components/panels/StateTreeExplorer";
import { TimeTravelPanel } from "./components/panels/TimeTravelPanel";

import appStyles from "./styles/App.module.css";

const TABS = ["Inspector", "State", "Time Travel", "Metrics"] as const;

type TabName = (typeof TABS)[number];

/**
 * Configuration for mounting the DevTools app.
 *
 * @public
 */
export type DevtoolsAppConfig = HubConnectionConfig;

/**
 * Root DevTools app component. Wrap with {@link HubProvider} externally
 * or use {@link DevtoolsApp} which includes the provider.
 *
 * @public
 */
export function DevtoolsApp({ config }: { config: DevtoolsAppConfig }) {
  return (
    <ThemeProvider defaultTheme="dark">
      <HubProvider config={config}>
        <DevtoolsInner />
      </HubProvider>
    </ThemeProvider>
  );
}

// Maps each tab to the capability it requires. Inspector and Metrics are
// always available; State and Time Travel depend on the store's capabilities.
function tabRequires(tab: TabName, caps: StoreCapabilities | null): boolean {
  switch (tab) {
    case "Inspector":
    case "Metrics":
      return true;
    case "State":
      return caps?.stateSnapshot ?? false;
    case "Time Travel":
      return caps?.replay ?? false;
  }
}

function DevtoolsInner() {
  const { status } = useHubConnection();
  const stores = useStoreRegistry();
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabName>("Inspector");

  // Auto-select first store if none selected.
  const effectiveStoreId =
    selectedStoreId && stores.some((s) => s.id === selectedStoreId)
      ? selectedStoreId
      : (stores[0]?.id ?? null);

  // Capabilities of the currently selected store.
  const caps: StoreCapabilities | null =
    stores.find((s) => s.id === effectiveStoreId)?.capabilities ?? null;

  // When the store changes, redirect to "Inspector" if the active tab is no
  // longer supported by the new store's capabilities.
  useEffect(() => {
    if (!tabRequires(activeTab, caps)) {
      setActiveTab("Inspector");
    }
    // Intentionally re-run only on store change, not on activeTab/caps identity.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveStoreId]);

  const { entries } = useEventLog(effectiveStoreId);
  const {
    state,
    loading: stateLoading,
    refresh: refreshState,
  } = useStoreState(effectiveStoreId);
  const { data: subscriptions } = useStoreSubscriptions(effectiveStoreId);
  const { metrics, loading: metricsLoading } = useStoreMetrics(effectiveStoreId);
  const { emit } = useEventEmitter(effectiveStoreId);
  const timeTravel = useTimeTravel(effectiveStoreId, entries, caps?.replay ?? false);

  const availableTabs = TABS.filter((tab) => tabRequires(tab, caps));

  return (
    <main className={appStyles.main}>
      <TopBar
        stores={stores}
        selectedStoreId={effectiveStoreId}
        onSelectStore={setSelectedStoreId}
      />
      <nav className={appStyles.tabBar}>
        {availableTabs.map((tab) => (
          <button
            key={tab}
            className={cx(appStyles.tab, { [appStyles.tabActive]: activeTab === tab })}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </nav>
      <div className={appStyles.content}>
        {effectiveStoreId == null ? (
          <div className={appStyles.emptyState}>
            {status === "connected"
              ? "Waiting for stores to connect…"
              : "Connecting to hub…"}
          </div>
        ) : (
          <>
            {activeTab === "Inspector" && (
              <Inspector
                entries={entries}
                canEmit={caps?.emit ?? false}
                onEmit={emit}
              />
            )}
            {activeTab === "State" && caps?.stateSnapshot && (
              <StateTreeExplorer
                state={state}
                loading={stateLoading}
                onRefresh={refreshState}
              />
            )}
            {activeTab === "Time Travel" && caps?.replay && (
              <TimeTravelPanel
                entries={entries}
                currentIndex={timeTravel.currentIndex}
                isTimeTraveling={timeTravel.isTimeTraveling}
                previewState={timeTravel.previewState}
                frameCount={timeTravel.frameCount}
                onJumpTo={timeTravel.jumpTo}
                onStepBack={timeTravel.stepBack}
                onStepForward={timeTravel.stepForward}
                onResume={timeTravel.resume}
              />
            )}
            {activeTab === "Metrics" && (
              <MetricsDashboard
                metrics={metrics}
                loading={metricsLoading}
                subscriptions={subscriptions}
              />
            )}
          </>
        )}
      </div>
      <BottomBar
        status={status}
        entries={entries}
        isTimeTraveling={timeTravel.isTimeTraveling}
      />
    </main>
  );
}
