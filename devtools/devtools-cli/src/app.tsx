/**
 * @module @yoltra/devtools-cli
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
import { Box, Text } from "ink";
import { EventEmitter } from "./components/EventEmitter";
import { EventTimeline } from "./components/EventTimeline";
import { MetricsDashboard } from "./components/MetricsDashboard";
import { StateTree } from "./components/StateTree";
import { StatusBar } from "./components/StatusBar";
import { StoreTabs } from "./components/StoreTabs";
import { SubscriptionsPanel } from "./components/SubscriptionsPanel";
import { useFocusManager } from "./hooks/useFocusManager";
import { useKeyBindings } from "./hooks/useKeyBindings";

/**
 * Root Ink app component with embedded hub connection.
 *
 * Wraps the entire CLI application in a {@link HubProvider} and renders
 * the store tabs, panel tab bar, active panel content, and status bar.
 * Keyboard navigation is handled via {@link useKeyBindings}.
 *
 * @param props.config - Hub connection configuration (host, port, etc.).
 * @public
 */
export function App({ config }: { config: HubConnectionConfig }) {
  return (
    <HubProvider config={config}>
      <AppInner />
    </HubProvider>
  );
}

function AppInner() {
  const { status } = useHubConnection();
  const stores = useStoreRegistry();
  const { activeTab, selectedStoreIndex, nextTab, prevTab, nextStore, prevStore, tabs } =
    useFocusManager();

  const effectiveStoreId = stores[selectedStoreIndex]?.id ?? null;

  const { entries } = useEventLog(effectiveStoreId);
  const { state, loading: stateLoading } = useStoreState(effectiveStoreId);
  const { data: subscriptions, loading: subsLoading } = useStoreSubscriptions(effectiveStoreId);
  const { metrics, loading: metricsLoading } = useStoreMetrics(effectiveStoreId);
  const { emit } = useEventEmitter(effectiveStoreId);

  useKeyBindings({
    onNextTab: nextTab,
    onPrevTab: prevTab,
    onNextStore: () => nextStore(stores.length),
    onPrevStore: () => prevStore(stores.length),
    onQuit: () => process.exit(0),
  });

  return (
    <Box flexDirection='column' height='100%'>
      {/* Header: title + store tabs */}
      <Box
        borderStyle='round'
        borderColor='blue'
        borderBottom
        borderTop={false}
        borderLeft={false}
        borderRight={false}
        paddingX={1}
      >
        <Text bold color='cyan'>
          Yoltra DevTools
        </Text>
        <Text> {" | "} </Text>
        <StoreTabs stores={stores} selectedIndex={selectedStoreIndex} />
      </Box>

      {/* Tab bar */}
      <Box gap={1} paddingX={1} marginTop={0}>
        {tabs.map((tab) => (
          <Text
            key={tab}
            bold={activeTab === tab}
            color={activeTab === tab ? "cyan" : undefined}
            dimColor={activeTab !== tab}
          >
            {activeTab === tab ? `[${tab}]` : ` ${tab} `}
          </Text>
        ))}
      </Box>

      {/* Panel content */}
      <Box
        flexDirection='column'
        flexGrow={1}
        borderStyle='single'
        borderColor='gray'
        borderTop
        borderBottom
        borderLeft={false}
        borderRight={false}
      >
        {effectiveStoreId == null ? (
          <Box paddingX={1} paddingY={1}>
            <Text dimColor>
              {status === "connected"
                ? "Waiting for stores to connect..."
                : "Connecting to hub..."}
            </Text>
          </Box>
        ) : (
          <>
            {activeTab === "Events" && <EventTimeline entries={entries} />}
            {activeTab === "State" && <StateTree state={state} loading={stateLoading} />}
            {activeTab === "Subscriptions" && (
              <SubscriptionsPanel data={subscriptions} loading={subsLoading} />
            )}
            {activeTab === "Metrics" && (
              <MetricsDashboard metrics={metrics} loading={metricsLoading} />
            )}
            {activeTab === "Emit" && <EventEmitter onEmit={emit} />}
          </>
        )}
      </Box>

      {/* Status bar */}
      <StatusBar status={status} />
    </Box>
  );
}
