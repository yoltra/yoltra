/**
 * @module @yoltra/devtools-storeview
 *
 * React DOM UI for Yoltra DevTools.
 * Used by both the browser extension panel and the VSCode webview.
 * Provides a mountable React app and individual panel components.
 */

import { createRoot } from "react-dom/client";
import { DevtoolsApp, type DevtoolsAppConfig } from "./App";

// Global styles — CSS custom properties + VSCode theme integration.
// `variables.css` and `vscode-theme.css` are plain (non-module) CSS on
// purpose: they define only `:root` tokens. As a CSS *module* imported for
// side-effect, the token block would be tree-shaken out of the bundle.
import "./styles/App.module.css";
import "./styles/variables.css";
import "./styles/vscode-theme.css";

// ─── Mount API ───────────────────────────────────────────────────────

/**
 * Mount the DevTools React app into a DOM container.
 *
 * @param container - The DOM element to mount into.
 * @param config - Hub connection configuration.
 * @returns An unmount function.
 *
 * @public
 */
export function mountDevtools(container: HTMLElement, config: DevtoolsAppConfig): () => void {
  const root = createRoot(container);
  root.render(<DevtoolsApp config={config} />);
  return () => root.unmount();
}

// ─── React Components ────────────────────────────────────────────────

export { DevtoolsApp } from "./App";
export type { DevtoolsAppConfig } from "./App";

// Layout
export { BottomBar } from "./components/layout/BottomBar";
export type { BottomBarProps } from "./components/layout/BottomBar";
export { TopBar } from "./components/layout/TopBar";
export type { TopBarProps } from "./components/layout/TopBar";

// Panels
export { EventEmitterPanel } from "./components/panels/EventEmitter";
export type { EventEmitterPanelProps } from "./components/panels/EventEmitter";
export { EventTimeline } from "./components/panels/EventTimeline";
export type { EventTimelineProps } from "./components/panels/EventTimeline";
export { Inspector } from "./components/panels/Inspector";
export type { InspectorProps } from "./components/panels/Inspector";
export { MetricsDashboard } from "./components/panels/MetricsDashboard";
export type { MetricsDashboardProps, MetricsData, SubscriptionData } from "./components/panels/MetricsDashboard";
export { StateTreeExplorer } from "./components/panels/StateTreeExplorer";
export type { StateTreeExplorerProps } from "./components/panels/StateTreeExplorer";
export { SubscriptionsPanel } from "./components/panels/SubscriptionsPanel";
export type { SubscriptionsPanelProps } from "./components/panels/SubscriptionsPanel";
export { TimeTravelPanel } from "./components/panels/TimeTravelPanel";
export type { TimeTravelPanelProps } from "./components/panels/TimeTravelPanel";

// Shared
export { ConnectionDot } from "./components/shared/ConnectionDot";
export type { ConnectionDotProps } from "./components/shared/ConnectionDot";
export { FilterBar } from "./components/shared/FilterBar";
export type { FilterBarProps } from "./components/shared/FilterBar";
export { JsonTree } from "./components/shared/JsonTree";
export type { JsonTreeProps } from "./components/shared/JsonTree";
