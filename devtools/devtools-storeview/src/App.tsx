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
import { useState } from "react";
import { BottomBar } from "./components/layout/BottomBar";
import { TopBar } from "./components/layout/TopBar";
import { EventEmitterPanel } from "./components/panels/EventEmitter";
import { EventTimeline } from "./components/panels/EventTimeline";
import { MetricsDashboard } from "./components/panels/MetricsDashboard";
import { StateTreeExplorer } from "./components/panels/StateTreeExplorer";
import { SubscriptionsPanel } from "./components/panels/SubscriptionsPanel";
import { TimeTravelPanel } from "./components/panels/TimeTravelPanel";
import {
  EventFrequencyHeatmap,
  ReducerActivityBars,
  StateTreemap,
} from "./components/panels/visualizations";

import yoltraLogo from "./assets/logo.svg";
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
export interface DevtoolsAppConfig extends HubConnectionConfig {}

/**
 * Root DevTools app component. Wrap with {@link HubProvider} externally
 * or use {@link DevtoolsApp} which includes the provider.
 *
 * @public
 */
export function DevtoolsApp({ config }: { config: DevtoolsAppConfig }) {
  return (
    <HubProvider config={config}>
      <DevtoolsInner />
    </HubProvider>
  );
}

function DevtoolsInner() {
  const { status } = useHubConnection();
  const stores = useStoreRegistry();
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabName>("Events");

  // Auto-select first store if none selected
  const effectiveStoreId =
    selectedStoreId && stores.some((s) => s.id === selectedStoreId)
      ? selectedStoreId
      : (stores[0]?.id ?? null);

  const { entries, clear: clearLog } = useEventLog(effectiveStoreId);
  const {
    state,
    loading: stateLoading,
    refresh: refreshState,
  } = useStoreState(effectiveStoreId);
  const { data: subscriptions, loading: subsLoading } = useStoreSubscriptions(effectiveStoreId);
  const { metrics, loading: metricsLoading } = useStoreMetrics(effectiveStoreId);
  const { currentIndex, isTimeTraveling, jumpTo, stepBack, stepForward, resume } =
    useTimeTravel(effectiveStoreId, entries);
  const { emit } = useEventEmitter(effectiveStoreId);

  return (
    <main className={appStyles.main}>
      <img className={"yoltra-logo"} src={yoltraLogo} />
      <TopBar
        stores={stores}
        selectedStoreId={effectiveStoreId}
        onSelectStore={setSelectedStoreId}
      />
      <aside className={appStyles.aside}>
        {TABS.map((tab) => (
          <button
            key={tab}
            className={`${appStyles.tabButton} ${activeTab === tab ? appStyles.tabButtonActive : ""}`}
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
            {activeTab === "State" && (
              <StateTreeExplorer
                state={state}
                loading={stateLoading}
                onRefresh={refreshState}
              />
            )}
            {activeTab === "Subscriptions" && (
              <SubscriptionsPanel data={subscriptions} loading={subsLoading} />
            )}
            {activeTab === "Time Travel" && (
              <TimeTravelPanel
                entries={entries}
                currentIndex={currentIndex}
                isTimeTraveling={isTimeTraveling}
                onJumpTo={jumpTo}
                onStepBack={stepBack}
                onStepForward={stepForward}
                onResume={resume}
              />
            )}
            {activeTab === "Emit" && <EventEmitterPanel onEmit={emit} />}
            {activeTab === "Metrics" && (
              <MetricsDashboard metrics={metrics} loading={metricsLoading} />
            )}
            {activeTab === "Heatmap" && <EventFrequencyHeatmap entries={entries} />}
            {activeTab === "Reducers" && (
              <ReducerActivityBars entries={entries} subscriptions={subscriptions} />
            )}
            {activeTab === "Treemap" && (
              <StateTreemap state={state} loading={stateLoading} entries={entries} />
            )}
          </>
        )}
      </article>

      <BottomBar status={status} />
    </main>
  );
}
