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
  type HubConnectionConfig,
} from "@yoltra/devtools-ui";
import { ThemeProvider } from "./theme";
import type { StoreCapabilities } from "@yoltra/devtools-protocol";
import cx from "classnames";
import { useEffect, useState } from "react";

import { BottomBar } from "./components/layout/BottomBar";
import { TopBar } from "./components/layout/TopBar";
import { EventEmitterPanel } from "./components/panels/EventEmitter";
import { EventTimeline } from "./components/panels/EventTimeline";
import { MetricsDashboard } from "./components/panels/MetricsDashboard";
import { StateTreeExplorer } from "./components/panels/StateTreeExplorer";
import { SubscriptionsPanel } from "./components/panels/SubscriptionsPanel";
import {
  EventFrequencyHeatmap,
  ReducerActivityBars,
  StateTreemap,
} from "./components/panels/visualizations";

import yoltraLogo from "./assets/logo-large.png";
import appStyles from "./styles/App.module.css";

const TABS = [
  "Events",
  "State",
  "Subscriptions",
  "Time Travel",
  "Emit",
  "Metrics",
  "Heatmap",
  "Reducers",
  "Treemap",
] as const;

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

// Maps each tab to the capability it requires. `null` means always available.
function tabRequires(tab: TabName, caps: StoreCapabilities | null): boolean {
  if (!caps) {
    // No store selected yet — only show always-on tabs.
    return tab === "Events" || tab === "Metrics" || tab === "Heatmap";
  }
  switch (tab) {
    case "Events":
    case "Metrics":
    case "Heatmap":
      return true;
    case "State":
    case "Treemap":
      return caps.stateSnapshot;
    case "Subscriptions":
      return caps.subscriptionMeta || caps.pipelineMeta;
    case "Reducers":
      return caps.pipelineMeta;
    case "Time Travel":
      return caps.replay;
    case "Emit":
      return caps.emit;
  }
}

function DevtoolsInner() {
  const { status } = useHubConnection();
  const stores = useStoreRegistry();
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabName>("Events");

  // Auto-select first store if none selected.
  const effectiveStoreId =
    selectedStoreId && stores.some((s) => s.id === selectedStoreId)
      ? selectedStoreId
      : (stores[0]?.id ?? null);

  // Capabilities of the currently selected store.
  const caps: StoreCapabilities | null =
    stores.find((s) => s.id === effectiveStoreId)?.capabilities ?? null;

  // When the store changes, redirect to "Events" if the active tab is no
  // longer supported by the new store's capabilities.
  useEffect(() => {
    if (!tabRequires(activeTab, caps)) {
      setActiveTab("Events");
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
  const { data: subscriptions, loading: subsLoading } = useStoreSubscriptions(effectiveStoreId);
  const { metrics, loading: metricsLoading } = useStoreMetrics(effectiveStoreId);
  const { emit } = useEventEmitter(effectiveStoreId);

  const availableTabs = TABS.filter((tab) => tabRequires(tab, caps));

  return (
    <main className={appStyles.main}>
      <img className={"yoltra-logo"} src={yoltraLogo} />
      <TopBar
        stores={stores}
        selectedStoreId={effectiveStoreId}
        onSelectStore={setSelectedStoreId}
      />
      <aside className={appStyles.aside}>
        {availableTabs.map((tab) => (
          <button
            key={tab}
            className={cx({ active: activeTab === tab })}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </aside>
      <article className={appStyles.content}>
        {effectiveStoreId == null ? (
          <div className={appStyles.emptyState}>
            {status === "connected"
              ? "Waiting for stores to connect..."
              : "Connecting to hub..."}
          </div>
        ) : (
          <>
            {activeTab === "Events" && <EventTimeline entries={entries} />}
            {activeTab === "State" && caps?.stateSnapshot && (
              <StateTreeExplorer
                state={state}
                loading={stateLoading}
                onRefresh={refreshState}
              />
            )}
            {activeTab === "Subscriptions" &&
              (caps?.subscriptionMeta || caps?.pipelineMeta) && (
                <SubscriptionsPanel data={subscriptions} loading={subsLoading} />
              )}
            {activeTab === "Emit" && caps?.emit && <EventEmitterPanel onEmit={emit} />}
            {activeTab === "Metrics" && (
              <MetricsDashboard metrics={metrics} loading={metricsLoading} />
            )}
            {activeTab === "Heatmap" && <EventFrequencyHeatmap entries={entries} />}
            {activeTab === "Reducers" && caps?.pipelineMeta && (
              <ReducerActivityBars entries={entries} subscriptions={subscriptions} />
            )}
            {activeTab === "Treemap" && caps?.stateSnapshot && (
              <StateTreemap state={state} loading={stateLoading} entries={entries} />
            )}
          </>
        )}
      </article>
      <BottomBar
        status={status}
        effectiveStoreId={effectiveStoreId}
        entries={entries}
        capabilities={caps}
      />
    </main>
  );
}
