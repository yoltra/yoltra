/**
 * @module @yoltra/devtools-storeview/visualizations
 *
 * Graphical visualization panels for Yoltra DevTools.
 *
 * All three components are drop-in panels that accept data already
 * available in `App.tsx` — no new protocol messages or core-package
 * changes are required.
 *
 * ## Usage in App.tsx
 *
 * ```tsx
 * import {
 *   EventFrequencyHeatmap,
 *   ReducerActivityBars,
 *   StateTreemap,
 * } from "./components/panels/visualizations";
 *
 * // Add to the TABS const array:
 * const TABS = [...existing, "Heatmap", "Reducers", "Treemap"] as const;
 *
 * // Add to the panel render block:
 * {activeTab === "Heatmap"  && <EventFrequencyHeatmap entries={entries} />}
 * {activeTab === "Reducers" && <ReducerActivityBars entries={entries} subscriptions={subscriptions} />}
 * {activeTab === "Treemap"  && <StateTreemap state={state} loading={stateLoading} entries={entries} />}
 * ```
 *
 * ## Data requirements per component
 *
 * | Component               | Props needed from App.tsx                           |
 * |-------------------------|-----------------------------------------------------|
 * | `EventFrequencyHeatmap` | `entries` from `useEventLog`                        |
 * | `ReducerActivityBars`   | `entries` + `subscriptions` from `useStoreSubscriptions` |
 * | `StateTreemap`          | `state` + `loading` from `useStoreState` + `entries` |
 */

export { EventFrequencyHeatmap } from "./EventFrequencyHeatmap";
export { ReducerActivityBars } from "./ReducerActivityBars";
export { StateTreemap } from "./StateTreemap";
